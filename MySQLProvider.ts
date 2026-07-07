import { DatabaseProvider } from "@tokenring-ai/database";
import type { DatabaseProviderOptions, ExecuteSqlResult } from "@tokenring-ai/database/DatabaseProvider";
import { SQL } from "bun";

export interface MySQLResourceProps extends DatabaseProviderOptions {
  host: string;
  port?: number | undefined;
  user: string;
  password: string;
  databaseName: string;
  connectionLimit?: number | undefined;
}

export default class MySQLProvider extends DatabaseProvider {
  private sql: SQL;

  constructor({ allowWrites = false, host, port = 3306, user, password, databaseName, connectionLimit = 10 }: MySQLResourceProps) {
    super(allowWrites);

    this.sql = new SQL({
      adapter: "mysql",
      hostname: host,
      port,
      username: user,
      password,
      database: databaseName,
      max: connectionLimit,
    });
  }

  /**
   * Executes an SQL query on the MySQL database using Bun's built-in SQL client.
   */
  async executeSql(sqlQuery: string): Promise<ExecuteSqlResult> {
    const result = await this.sql.unsafe<Record<string,string|number|null>[]>(sqlQuery);

    return {
      rows: [...result],
      fields: result.length > 0 ? Object.keys(result[0]!) : [],
    };
  }

  /**
   * Shows the schema for all tables in a given MySQL database.
   */
  async showSchema(): Promise<Record<string, string>> {
    const tables = await this.sql.unsafe<Record<string,string|number|null>[]>("SHOW TABLES");
    const schema: Record<string, string> = {};

    for (const tableRow of tables) {
      const tableName = String(Object.values(tableRow)[0]);
      const createTableRows = await this.sql<Record<string,string>[]>`SHOW CREATE TABLE ${this.sql(tableName)}`;
      const createTableResult = [...createTableRows]

      if (createTableResult[0]?.["Create Table"]) {
        schema[tableName] = createTableResult[0]["Create Table"];
      } else {
        schema[tableName] = "Could not retrieve CREATE TABLE statement.";
      }
    }

    return schema;
  }
}