import {TokenRingPlugin} from "@tokenring-ai/app";
import {DatabaseConfigSchema} from "@tokenring-ai/database";
import DatabaseService from "@tokenring-ai/database/DatabaseService";
import {z} from "zod";
import MySQLProvider from "./MySQLProvider.js";
import packageJSON from './package.json' with {type: 'json'};

const packageConfigSchema = z.object({
  database: DatabaseConfigSchema
});

export default {
  name: packageJSON.name,
  version: packageJSON.version,
  description: packageJSON.description,
  install(app, config) {
    if (config.database) {
      app.waitForService(DatabaseService, databaseService => {
        for (const name in config.database!.providers) {
          const provider = config.database!.providers[name];
          if (provider.type === "mysql") {
            databaseService.registerDatabase(name, new MySQLProvider(provider));
          }
        }
      });
    }
  },
  config: packageConfigSchema
} satisfies TokenRingPlugin<typeof packageConfigSchema>;
