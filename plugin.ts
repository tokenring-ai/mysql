import {TokenRingPlugin} from "@tokenring-ai/app";
import DatabaseService from "@tokenring-ai/database/DatabaseService";
import {z} from "zod";
import MySQLProvider from "./MySQLProvider.ts";
import packageJSON from "./package.json" with {type: "json"};
import {type MySQLAccount, MySQLAccountSchema, MySQLConfigSchema} from "./schema.ts";

const packageConfigSchema = z.object({
  mysql: MySQLConfigSchema.prefault({accounts: {}}),
});

function addAccountsFromEnv(accounts: Record<string, Partial<MySQLAccount>>) {
  for (const [key, value] of Object.entries(process.env)) {
    const match = key.match(/^MYSQL_HOST(\d*)$/);
    if (!match || !value) continue;
    const n = match[1];
    const user = process.env[`MYSQL_USER${n}`];
    const password = process.env[`MYSQL_PASSWORD${n}`];
    const databaseName = process.env[`MYSQL_DATABASE${n}`];
    if (!user || !password || !databaseName) continue;
    const name = process.env[`MYSQL_ACCOUNT_NAME${n}`] ?? `MySQL${n ? ` ${n}` : ""}`;
    accounts[name] = {
      host: value,
      port: process.env[`MYSQL_PORT${n}`] ? Number(process.env[`MYSQL_PORT${n}`]) : 3306,
      user,
      password,
      databaseName,
      allowWrites: !!process.env[`MYSQL_ALLOW_WRITES${n}`],
    };
  }
}

export default {
  name: packageJSON.name,
  displayName: "MySQL Integration",
  version: packageJSON.version,
  description: packageJSON.description,
  install(app, config) {
    addAccountsFromEnv(config.mysql.accounts);
    if (Object.keys(config.mysql.accounts).length === 0) return;

    app.waitForService(DatabaseService, databaseService => {
      for (const [name, account] of Object.entries(config.mysql.accounts)) {
        databaseService.registerDatabase(name, new MySQLProvider(MySQLAccountSchema.parse(account)));
      }
    });
  },
  config: packageConfigSchema,
} satisfies TokenRingPlugin<typeof packageConfigSchema>;
