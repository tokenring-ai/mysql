import mysql from 'mysql2/promise';
import { DatabaseResource } from '@token-ring/database'; // Adjusted import path

export default class MySQLResource extends DatabaseResource {
  pool = null;

  constructor(properties) {
    const propsWithDefaults = {
      port: 3306,
      connectionLimit: 10, // Default connection limit for the pool
      ...properties
    };
    super(propsWithDefaults);
    // Initialize the pool here or in an async start method
    this.pool = mysql.createPool({
      host: this.host,
      port: this.port,
      user: this.user,
      password: this.password,
      database: this.databaseName, // Default database for the pool
      waitForConnections: true,
      connectionLimit: propsWithDefaults.connectionLimit,
      queueLimit: 0 // Unlimited queue
    });
  }

  // The connect method is no longer needed for individual connections managed by the pool.
  // If a specific database needs to be targeted for a query that is different from this.databaseName,
  // the query itself should specify it (e.g., USE other_db; SELECT ...), or a separate resource
  // instance configured for that database should be used.
  // For simplicity, this implementation assumes operations run on this.databaseName
  // or the query specifies the database.

  /**
   * Executes an SQL query on the MySQL database using a connection from the pool.
   * @param {string} sqlQuery - The SQL query string.
   * @param {object} [params] - Optional parameters. `params.values` for prepared statements.
   *                            `params.databaseName` is not directly used here as the pool connects to a default DB.
   *                            Queries needing a different DB should use `USE db_name;` or be on a different resource.
   * @returns {Promise<object>} The query result, including rows and fields.
   */
  async executeSql(sqlQuery, params = {}) {
    if (!sqlQuery) {
      throw new Error("sqlQuery is required for executeSql.");
    }
    let connection;
    try {
      connection = await this.pool.getConnection();
      // If params.databaseName is provided and different from this.databaseName,
      // a `USE databaseName;` could be prepended to sqlQuery, but this adds complexity
      // and potential for SQL injection if not handled carefully.
      // It's generally better to configure the pool with the specific database.
      // For this implementation, we assume the connection's default database is sufficient
      // or the query handles database selection.
      const [rows, fields] = await connection.execute(sqlQuery, params.values);
      return { rows, fields: fields.map(f => f.name) };
    } finally {
      if (connection) connection.release();
    }
  }

  /**
   * Lists all databases accessible by the MySQL connection from the pool.
   * @returns {Promise<string[]>} A list of database names.
   */
  async listDatabases() {
    let connection;
    try {
      connection = await this.pool.getConnection();
      const [rows] = await connection.execute('SHOW DATABASES;');
      return rows.map(row => row.Database);
    } finally {
      if (connection) connection.release();
    }
  }

  /**
   * Shows the schema for all tables in a given MySQL database using a connection from the pool.
   * @param {string} databaseName - The name of the database.
   * @returns {Promise<object>} An object mapping table names to their 'CREATE TABLE' statements.
   * @throws {Error} If databaseName is not provided or if any error occurs during schema retrieval.
   */
  async showSchema(databaseName) {
    if (!databaseName) {
      throw new Error("databaseName is required to show schema.");
    }

    let connection;
    try {
      connection = await this.pool.getConnection();
      // Temporarily switch database context for this connection if different from pool's default.
      // This is generally safe if the user has permissions.
      // Note: This changes the state of the connection for subsequent queries on it within this method.
      if (this.databaseName !== databaseName) {
        await connection.query(`USE \`${databaseName}\`;`);
      }

      const [tables] = await connection.execute('SHOW TABLES;');
      const schema = {};

      for (const tableRow of tables) {
        const tableName = Object.values(tableRow)[0];
        const [createTableRows] = await connection.execute(`SHOW CREATE TABLE \`${tableName}\`;`);
        if (createTableRows.length > 0 && createTableRows[0]['Create Table']) {
          schema[tableName] = createTableRows[0]['Create Table'];
        } else {
          schema[tableName] = 'Could not retrieve CREATE TABLE statement.';
        }
      }
      return schema;
    } finally {
      // If `USE` was called, the connection in the pool might be in a different DB state.
      // Releasing it is fine, but it's something to be aware of if connections are reused with assumptions.
      // For most cases, `mysql2` pool handles this okay.
      if (connection) connection.release();
    }
  }

  /**
   * Starts the resource. Currently, the pool is initialized in the constructor.
   * This method could be used for health checks or pre-warming connections if needed.
   */
  async start(registry) {
    await super.start(registry); // Calls the parent class's start method
    // Pool is initialized in constructor. Could add a health check here.
    try {
      const connection = await this.pool.getConnection();
      await connection.ping();
      connection.release();
      console.log(`${this.constructor.name} connection pool started and tested.`);
    } catch (error) {
      console.error(`${this.constructor.name} failed to connect to database on start:`, error);
      // Depending on policy, might want to re-throw or handle
    }
  }

  /**
   * Stops the resource and closes the connection pool.
   */
  async stop(registry) {
    await super.stop(registry); // Calls the parent class's stop method
    if (this.pool) {
      try {
        await this.pool.end();
        console.log(`${this.constructor.name} connection pool closed.`);
        this.pool = null;
      } catch (error) {
        console.error(`${this.constructor.name} error closing connection pool:`, error);
      }
    }
  }

  // getHost, getPort, getUser, getPassword, getDatabaseName are inherited from DatabaseResource
  // status method is inherited but can be overridden if MySQL needs specific logic (e.g., pool stats)
  async status(registry) {
    const parentStatus = await super.status(registry);
    if (!this.pool) {
      return { ...parentStatus, active: false, message: "Connection pool not initialized or closed." };
    }
    try {
      // A quick check to see if we can get a connection
      const connection = await this.pool.getConnection();
      await connection.ping();
      connection.release();
      return {
        ...parentStatus,
        active: true,
        message: "Connection pool active.",
        // Consider adding pool statistics if available and relevant
        // poolStats: {
        //   totalConnections: this.pool.totalConnections(),
        //   idleConnections: this.pool.idleConnections(),
        //   queuedTasks: this.pool.queuedTasks(),
        // }
      };
    } catch (error) {
      return { ...parentStatus, active: false, message: `Connection pool error: ${error.message}` };
    }
  }
}