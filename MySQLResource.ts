import {DatabaseResource} from "@token-ring/database";
import {DatabaseResourceOptions, ExecuteSqlResult} from "@token-ring/database/DatabaseResource";
import {createPool, Pool, PoolConnection, FieldPacket, QueryResult, RowDataPacket} from "mysql2/promise";

export interface MySQLResourceProps extends DatabaseResourceOptions {
 host: string;
 port?: number;
 user: string;
 password: string;
 databaseName: string;
 connectionLimit?: number;
}

export default class MySQLResource extends DatabaseResource {
  private pool!: Pool;

  constructor({
                allowWrites = false,
                host,
                port = 3306,
                user,
                password,
                databaseName,
                connectionLimit = 10
              }: MySQLResourceProps) {
    super({ allowWrites });

    // Initialize the pool
    this.pool = createPool({
      host: host,
      port: port,
      user: user,
      password: password,
      database: databaseName,
      waitForConnections: true,
      connectionLimit: connectionLimit,
      queueLimit: 0
    });
  }

  /**
   * Executes an SQL query on the MySQL database using a connection from the pool.
   */
  async executeSql(sqlQuery: string): Promise<ExecuteSqlResult> {
    let connection: PoolConnection | undefined;
    try {
      const connection = await this.pool.getConnection();
      const [rows, fields] = await connection.execute(sqlQuery);

      return {
        rows: rows as RowDataPacket[],
        fields: (fields as FieldPacket[]).map(f => f.name)
      };
    } finally {
      connection?.release();
    }
  }

  /**
   * Shows the schema for all tables in a given MySQL database using a connection from the pool.
   */
  async showSchema(): Promise<Record<string,string>> {
    let connection: PoolConnection | undefined;
    try {
      connection = await this.pool.getConnection();

      const [tables] = await connection.execute('SHOW TABLES;');
      const schema: Record<string, string> = {};

      for (const tableRow of tables as RowDataPacket[]) {
        const tableName = Object.values(tableRow)[0] as string;
        const [createTableRows] = await connection.execute(`SHOW CREATE TABLE \`${tableName}\`;`);

        const createTableResult = createTableRows as RowDataPacket[];
        if (createTableResult.length > 0 && createTableResult[0]['Create Table']) {
          schema[tableName] = createTableResult[0]['Create Table'] as string;
        } else {
          schema[tableName] = 'Could not retrieve CREATE TABLE statement.';
        }
      }

      return schema;
    } finally {
      if (connection) connection.release();
    }
  }
}