# MySQL Package Documentation

## Overview

The `@tokenring-ai/mysql` package provides MySQL database integration for the TokenRing AI platform. It extends the base `DatabaseResource` from `@tokenring-ai/database` to offer connection pooling, SQL query execution, and schema inspection capabilities specifically for MySQL databases. This package is designed for use in AI agents or services that require reliable database interactions, such as querying data or retrieving table schemas.

Key features include:
- Connection pooling using `mysql2` for efficient, reusable connections.
- Asynchronous SQL execution with result handling.
- Schema retrieval via `SHOW TABLES` and `SHOW CREATE TABLE` queries.
- Integration with the broader TokenRing ecosystem via the `DatabaseResource` base class, which may enforce read-only modes or other constraints.

## Installation/Setup

This package is part of the TokenRing AI monorepo under `pkg/mysql`. To use it in a larger project:

1. Ensure Node.js (v18+) and npm/yarn are installed.
2. If building from source, navigate to the project root and run:
   ```
   npm install
   npm run build
   ```
3. For standalone installation (if published):
   ```
   npm install @tokenring-ai/mysql @tokenring-ai/database mysql2
   ```
4. Set up environment variables or configuration for database credentials (host, port, user, password, database name).
5. Import and instantiate the `MySQLResource` class with the required props.

Note: This package assumes a MySQL server is running and accessible. Test connections during setup.

## Package Structure

The package is organized as follows:
- **`MySQLResource.ts`**: Core implementation of the MySQL database resource class, handling pooling and queries.
- **`index.ts`**: Main entry point, exporting `MySQLService` (alias for `MySQLResource`) and package metadata.
- **`package.json`**: Defines package metadata, dependencies, and exports.
- **`LICENSE`**: MIT license file.

No additional subdirectories; it's a lightweight, single-module package.

## Core Components

### MySQLResource Class

This is the primary class, extending `DatabaseResource` from `@tokenring-ai/database`. It manages a connection pool to a MySQL database.

#### Constructor

Initializes the connection pool with the provided options.

**Signature:**
```typescript
constructor({
  allowWrites = false,
  host: string,
  port?: number (default: 3306),
  user: string,
  password: string,
  databaseName: string,
  connectionLimit?: number (default: 10)
}: MySQLResourceProps)
```

**Parameters:**
- `allowWrites`: Boolean from base class; controls write permissions (default: false).
- `host`: MySQL server hostname or IP.
- `port`: MySQL port (default: 3306).
- `user`: Database username.
- `password`: Database password.
- `databaseName`: Name of the target database.
- `connectionLimit`: Maximum number of pooled connections (default: 10).

**Behavior:** Creates a `mysql2` pool with options like `waitForConnections: true` and `queueLimit: 0` for reliable queuing.

#### executeSql Method

Executes a raw SQL query and returns the results.

**Signature:**
```typescript
async executeSql(sqlQuery: string): Promise<ExecuteSqlResult>
```

**Parameters:**
- `sqlQuery`: The SQL statement to execute (e.g., `SELECT * FROM users`).

**Returns:** `ExecuteSqlResult` object with:
- `rows`: Array of row objects (as `RowDataPacket[]`).
- `fields`: Array of field names (strings).

**Behavior:** Acquires a pooled connection, executes the query, and releases the connection. Handles errors implicitly via try-finally. Supports SELECT, INSERT, UPDATE, etc., based on `allowWrites`.

**Example:**
```typescript
const result = await mysqlResource.executeSql('SELECT * FROM users WHERE id = 1');
console.log(result.rows); // Array of user rows
console.log(result.fields); // ['id', 'name', 'email']
```

#### showSchema Method

Retrieves the CREATE TABLE statements for all tables in the database.

**Signature:**
```typescript
async showSchema(): Promise<Record<string, string>>
```

**Returns:** Object mapping table names to their CREATE TABLE SQL strings. If retrieval fails for a table, it uses a fallback message.

**Behavior:** Queries `SHOW TABLES`, then for each table, runs `SHOW CREATE TABLE`. Uses a single pooled connection for efficiency.

**Example:**
```typescript
const schema = await mysqlResource.showSchema();
console.log(schema['users']); // "CREATE TABLE `users` ( ... ) ..."
```

**Interactions:** All methods use the shared pool for connections. The base `DatabaseResource` may add logging, validation, or read-only enforcement.

## Usage Examples

### Basic Connection and Query

```typescript
import MySQLResource from '@tokenring-ai/mysql';

const mysqlResource = new MySQLResource({
  host: 'localhost',
  user: 'root',
  password: 'password',
  databaseName: 'myapp',
  allowWrites: true // Enable if needed
});

async function queryUsers() {
  try {
    const result = await mysqlResource.executeSql('SELECT * FROM users');
    console.log('Users:', result.rows);
  } catch (error) {
    console.error('Query failed:', error);
  } finally {
    // Optional: End pool if done
    // await mysqlResource.pool.end();
  }
}

queryUsers();
```

### Schema Inspection

```typescript
import MySQLResource from '@tokenring-ai/mysql';

const mysqlResource = new MySQLResource({
  host: 'localhost',
  user: 'root',
  password: 'password',
  databaseName: 'myapp'
});

async function inspectSchema() {
  const schema = await mysqlResource.showSchema();
  Object.entries(schema).forEach(([table, createSql]) => {
    console.log(`Table: ${table}\nSchema: ${createSql.substring(0, 100)}...`);
  });
}

inspectSchema();
```

### Integration in TokenRing Agent

Assuming TokenRing agent setup:
```typescript
import { TokenRingAgent } from '@tokenring-ai/agent';
import MySQLResource from '@tokenring-ai/mysql';

const agent = new TokenRingAgent({
  resources: [
    new MySQLResource({
      host: process.env.MYSQL_HOST,
      // ... other props from env
    })
  ]
});

// Agent can now use the resource for DB operations
```

## Configuration Options

- **Database Props**: As in constructor (host, port, user, password, databaseName, connectionLimit).
- **Pool Options**: Internally fixed (waitForConnections: true, queueLimit: 0). Extend the class if custom pooling is needed.
- **Environment Variables**: Recommended for production (e.g., `MYSQL_HOST`, `MYSQL_USER`). Use a config loader.
- **Base Class Options**: `allowWrites` from `DatabaseResourceOptions`; may include logging or retry configs in the base.

No additional config files; all via constructor.

## API Reference

- **Class: `MySQLResource`**
  - `constructor(props: MySQLResourceProps)`: Initializes the resource.
  - `async executeSql(sqlQuery: string): Promise<ExecuteSqlResult>`: Executes SQL and returns rows/fields.
  - `async showSchema(): Promise<Record<string, string>>`: Returns schema for all tables.

- **Interfaces:**
  - `MySQLResourceProps`: Extends `DatabaseResourceOptions` with MySQL-specific fields.
  - `ExecuteSqlResult`: `{ rows: RowDataPacket[]; fields: string[]; }`.

- **Exports:**
  - `MySQLService`: Alias for `MySQLResource` (default export).
  - `packageInfo: TokenRingPackage`: Metadata from package.json.

## Dependencies

- `@tokenring-ai/database` (^0.1.0): Base `DatabaseResource` class and types.
- `mysql2` (^3.14.1): Promise-based MySQL client for Node.js.

Dev dependencies (for testing): vitest.

## Contributing/Notes

- **Testing:** Run `npm test` (uses Vitest) to verify functionality. Add integration tests for real MySQL instances.
- **Building:** Use TypeScript compilation; ensure ES modules (`type: 'module'`).
- **Known Limitations:**
  - Binary data handling not explicitly supported; use base64 if needed.
  - Error handling is basic (try-finally for connections); extend for transactions or advanced retries.
  - Assumes UTF-8 text; binary files skipped in searches.
  - Pool not ended automatically; call `pool.end()` manually if required.
- **License:** MIT (see LICENSE).
- For contributions, follow TokenRing AI guidelines: fork, PR with tests, update docs.

This documentation is based on the current codebase (v0.1.0). Check for updates in the repository.