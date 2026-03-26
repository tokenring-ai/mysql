# @tokenring-ai/mysql

## Overview

MySQL database integration package for the TokenRing AI platform, providing connection pooling, SQL query execution, and schema inspection capabilities through a unified interface. This package extends the base `DatabaseProvider` from `@tokenring-ai/database` to offer MySQL-specific functionality and integrates seamlessly with the TokenRing ecosystem as a plugin.

The package implements the MySQL database provider pattern, enabling TokenRing agents to interact with MySQL databases through a standardized interface. It leverages the `DatabaseService` for provider management and supports both read-only and read-write operations with configurable permissions.

## Key Features

- **Connection Pooling**: Efficient connection management using `mysql2` with configurable limits
- **SQL Query Execution**: Execute raw SQL queries with proper result handling
- **Schema Inspection**: Retrieve CREATE TABLE statements for all database tables
- **Plugin Integration**: Seamlessly integrates with TokenRing applications via the plugin system
- **Type-Safe Configuration**: Zod-based schema validation for configuration
- **Write Operation Control**: Optional write permission enforcement via `allowWrites` flag
- **TypeScript Support**: Full TypeScript definitions and type safety
- **Base Provider Extension**: Extends `DatabaseProvider` for consistent database interaction patterns

## Installation

```bash
bun install @tokenring-ai/mysql @tokenring-ai/database mysql2 zod
```

## Core Components/API

### MySQLProvider Class

The main class that provides MySQL database functionality. Extends `DatabaseProvider` from `@tokenring-ai/database`.

#### Interface: MySQLResourceProps

```typescript
interface MySQLResourceProps extends DatabaseProviderOptions {
  host: string;
  port?: number;
  user: string;
  password: string;
  databaseName: string;
  connectionLimit?: number;
}
```

**Properties:**

- `host` (string, required): MySQL server hostname or IP address
- `port` (number, optional): MySQL port number (default: `3306`)
- `user` (string, required): Database username
- `password` (string, required): Database password
- `databaseName` (string, required): Name of the target database
- `connectionLimit` (number, optional): Maximum number of pooled connections (default: `10`)

**Inherited Properties from `DatabaseProviderOptions`:**

- `allowWrites` (boolean, optional): Whether to allow write operations (default: `false`)

#### Constructor

```typescript
constructor(props: MySQLResourceProps)
```

**Parameters:**

- `props` (MySQLResourceProps): Configuration object containing database connection details

**Example:**

```typescript
const mysqlProvider = new MySQLProvider({
  host: "localhost",
  port: 3306,
  user: "root",
  password: "password",
  databaseName: "myapp",
  connectionLimit: 10,
  allowWrites: false
});
```

#### Methods

##### executeSql

```typescript
async executeSql(sqlQuery: string): Promise<ExecuteSqlResult>
```

Executes a raw SQL query and returns the results. Uses a connection from the pool and automatically releases it after execution.

**Parameters:**

- `sqlQuery` (string): The SQL query to execute

**Returns:** `ExecuteSqlResult` object containing:
- `rows`: Array of row objects (`RowDataPacket[]`) - Each row is a record with column names as keys
- `fields`: Array of field names (`string[]`) - Column names from the query result

**Example:**

```typescript
const result = await mysqlProvider.executeSql("SELECT * FROM users WHERE id = 1");
console.log(result.rows); // [{ id: 1, name: "John", email: "john@example.com" }]
console.log(result.fields); // ["id", "name", "email"]
```

**Error Handling:**

- Throws errors for invalid SQL syntax
- Throws errors for connection failures
- Throws errors when write operations are attempted with `allowWrites: false`

##### showSchema

```typescript
async showSchema(): Promise<Record<string, string>>
```

Retrieves the CREATE TABLE statements for all tables in the database. Uses `SHOW TABLES` and `SHOW CREATE TABLE` commands.

**Returns:** Object mapping table names to their CREATE TABLE SQL strings.

**Example:**

```typescript
const schema = await mysqlProvider.showSchema();
console.log(schema.users);
// "CREATE TABLE `users` (
//   `id` int(11) NOT NULL AUTO_INCREMENT,
//   `name` varchar(255) NOT NULL,
//   `email` varchar(255) NOT NULL,
//   PRIMARY KEY (`id`)
// ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;"
```

**Implementation Details:**

- Executes `SHOW TABLES` to get all table names
- For each table, executes `SHOW CREATE TABLE \`${tableName}\``
- Returns a record mapping table names to their CREATE TABLE statements
- If a table's CREATE statement cannot be retrieved, returns "Could not retrieve CREATE TABLE statement."

### Package Exports

This package supports multiple import paths:

```typescript
// Main package import (default export)
import MySQLProvider from '@tokenring-ai/mysql';

// Direct import with extension
import MySQLProvider from '@tokenring-ai/mysql/MySQLProvider.js';
```

## Services

### MySQLProvider Registration

The MySQL plugin registers MySQL providers with the `DatabaseService` when configured:

```typescript
// After plugin installation
const databaseService = app.services.find(s => s.name === "DatabaseService");
const mysqlProvider = databaseService.getDatabaseByName("mymysql");
```

### Plugin Installation Flow

1. Plugin receives configuration with `database.providers` object
2. For each provider with `type === "mysql"`, creates a new `MySQLProvider` instance
3. Registers the provider with `DatabaseService` using `registerDatabase(name, provider)`
4. Uses `app.waitForService` to ensure `DatabaseService` is available before registration

### DatabaseService Integration

The `DatabaseService` from `@tokenring-ai/database` manages all database providers using a `KeyedRegistry` pattern:

```typescript
// DatabaseService provides these methods:
- registerDatabase(name: string, provider: DatabaseProvider): void
- getDatabaseByName(name: string): DatabaseProvider | undefined
- getAvailableDatabases(): string[] // Returns all registered database names
```

MySQL providers are registered as `DatabaseProvider` instances and can be accessed through the `DatabaseService`.

## Providers

### MySQLProvider

The `MySQLProvider` class extends `DatabaseProvider` from `@tokenring-ai/database` and implements the required methods for MySQL-specific functionality.

**Provider Interface:**

```typescript
interface MySQLResourceProps extends DatabaseProviderOptions {
  host: string;
  port?: number;
  user: string;
  password: string;
  databaseName: string;
  connectionLimit?: number;
}
```

**Provider Properties:**

- `host`: MySQL server hostname or IP address (required)
- `port`: MySQL port number (default: `3306`)
- `user`: Database username (required)
- `password`: Database password (required)
- `databaseName`: Name of the target database (required)
- `connectionLimit`: Maximum number of pooled connections (default: `10`)
- `allowWrites`: Whether to allow write operations (default: `false`)

## Plugin Configuration

### Configuration Schema

The plugin uses the `DatabaseConfigSchema` from `@tokenring-ai/database` for configuration validation:

```typescript
import { z } from "zod";
import { DatabaseConfigSchema } from "@tokenring-ai/database";

const packageConfigSchema = z.object({
  database: DatabaseConfigSchema
});
```

### Example Configuration

```typescript
const databaseConfig = {
  providers: {
    mymysql: {
      type: "mysql",
      host: "localhost",
      port: 3306,
      user: "root",
      password: "password",
      databaseName: "myapp",
      connectionLimit: 10,
      allowWrites: false
    }
  }
};
```

### Configuration Properties

When configuring a MySQL provider, the following properties are supported:

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `type` | string | Yes | - | Must be `"mysql"` |
| `host` | string | Yes | - | MySQL server hostname or IP address |
| `port` | number | No | `3306` | MySQL port number |
| `user` | string | Yes | - | Database username |
| `password` | string | Yes | - | Database password |
| `databaseName` | string | Yes | - | Name of the target database |
| `connectionLimit` | number | No | `10` | Maximum number of pooled connections |
| `allowWrites` | boolean | No | `false` | Whether to allow write operations |

### Pool Configuration

The connection pool uses these internal settings:

- `waitForConnections: true` - Wait for available connections if pool is exhausted
- `queueLimit: 0` - Unlimited queue size
- `connectionLimit` - Configurable maximum connections (default: 10)

## Agent Configuration

This package does not have any services with an `attach(agent: Agent)` method that merges in an agent config schema.

## Tools

The `@tokenring-ai/mysql` package itself doesn't define tools directly, but it works with the database tools provided by `@tokenring-ai/database`:

- **database_executeSql**: Executes SQL queries on registered MySQL databases
- **database_showSchema**: Retrieves database schemas for registered MySQL databases

These tools are automatically available when the plugin is registered with a TokenRing application and MySQL providers are configured.

## RPC Endpoints

This package does not define RPC endpoints.

## State Management

This package does not have state slices or state management functionality.

## Best Practices

- **Connection Pooling**: Use appropriate connection limits based on your application's concurrency requirements. The default of 10 connections is suitable for most use cases.
- **Write Protection**: Use the `allowWrites` flag to restrict write operations. Set to `false` for read-only agents and `true` when write operations are needed.
- **Error Handling**: Always handle errors from database operations. Connection errors, SQL syntax errors, and permission errors are propagated directly from the MySQL driver.
- **Security**: Never commit credentials to version control. Use environment variables for sensitive data like database passwords.
- **Schema Inspection**: Use `showSchema()` to understand database structure before executing queries. This helps agents make informed decisions about database operations.
- **Connection Management**: The package automatically manages connection pooling and releases connections after use. No manual connection management is required.
- **Multiple Databases**: Configure multiple MySQL providers to work with different databases. Each provider is registered with a unique name in the `DatabaseService`.

## Usage Examples

### As a TokenRing Plugin

```typescript
import TokenRingApp from "@tokenring-ai/app";
import databasePlugin from "@tokenring-ai/database";
import mysqlPlugin from "@tokenring-ai/mysql";

const app = new TokenRingApp({
  config: {
    database: {
      providers: {
        mymysql: {
          type: "mysql",
          host: "localhost",
          port: 3306,
          user: "root",
          password: "password",
          databaseName: "myapp",
          connectionLimit: 10,
          allowWrites: false
        }
      }
    }
  }
});

app.use(databasePlugin);
app.use(mysqlPlugin);
await app.start();

// Database service and tools are now available
// MySQL providers are registered with DatabaseService
```

### Accessing MySQL Providers

```typescript
// Access via DatabaseService
const databaseService = agent.requireServiceByType(DatabaseService);
const mysqlProvider = databaseService.getDatabaseByName("mymysql");
const result = await mysqlProvider.executeSql("SELECT * FROM users");
```

### Direct MySQLProvider Usage

```typescript
import MySQLProvider from "@tokenring-ai/mysql";

const mysqlProvider = new MySQLProvider({
  host: "localhost",
  port: 3306,
  user: "root",
  password: "password",
  databaseName: "myapp",
  connectionLimit: 10,
  allowWrites: true
});

// Execute SQL query
const result = await mysqlProvider.executeSql("SELECT * FROM users");
console.log("Users:", result.rows);
console.log("Fields:", result.fields);

// Inspect database schema
const schema = await mysqlProvider.showSchema();
console.log("Table schemas:", schema);
```

### Integration with DatabaseService

Access MySQL providers through the DatabaseService:

```typescript
import { DatabaseService } from "@tokenring-ai/database";

// Get DatabaseService from app
const databaseService = app.getServiceByType(DatabaseService);

// Get registered MySQL provider
const mysqlProvider = databaseService.getDatabaseByName("mymysql");

// Execute queries
const result = await mysqlProvider.executeSql("SELECT * FROM users");
```

### Multiple Database Providers

Configure multiple MySQL databases:

```typescript
const app = new TokenRingApp({
  config: {
    database: {
      providers: {
        production: {
          type: "mysql",
          host: "prod-db.example.com",
          user: "prod_user",
          password: "prod_password",
          databaseName: "production_db",
          allowWrites: true
        },
        staging: {
          type: "mysql",
          host: "staging-db.example.com",
          user: "staging_user",
          password: "staging_password",
          databaseName: "staging_db",
          allowWrites: false
        }
      }
    }
  }
});

app.use(databasePlugin);
app.use(mysqlPlugin);
await app.start();

// Access different databases
const databaseService = app.getServiceByType(DatabaseService);
const productionDB = databaseService.getDatabaseByName("production");
const stagingDB = databaseService.getDatabaseByName("staging");
```

### KeyedRegistry Pattern

The `DatabaseService` uses the `KeyedRegistry` pattern for managing database providers:

```typescript
import KeyedRegistry from "@tokenring-ai/utility/registry/KeyedRegistry";

// The DatabaseService internally uses:
databases = new KeyedRegistry<DatabaseProvider>();

// This provides:
- register(name, item): Register a new provider
- getItemByName(name): Retrieve a provider by name
- getAllItemNames(): Get all registered provider names
```

## Error Handling

The package provides comprehensive error handling through the MySQL driver and connection pooling:

**Common Error Scenarios:**

| Error | Cause | Solution |
|-------|-------|----------|
| Connection timeout | Network issues or incorrect host/port | Verify host, port, and network connectivity |
| Authentication failure | Invalid credentials | Verify username, password, and MySQL user privileges |
| Database access error | Insufficient permissions | Ensure the user has proper permissions for the database |
| SQL syntax error | Invalid SQL query | Validate your SQL queries before execution |
| Connection pool exhaustion | Too many concurrent connections | Increase `connectionLimit` in configuration |
| Write operation blocked | `allowWrites` is `false` | Set `allowWrites: true` if write operations are needed |

**Error Propagation:**

- Errors from `mysql2` are propagated directly to the caller
- Connection errors are thrown immediately if the pool cannot establish connections
- Query errors include the SQL statement and MySQL error details

## Security Considerations

- Use environment variables for sensitive credentials
- Configure `allowWrites` carefully to prevent unauthorized modifications
- Consider using read-only users for agents that only need to query data
- Validate and sanitize all SQL input to prevent injection attacks
- Limit database access to necessary tables and operations based on agent requirements
- Never commit credentials to version control

## Development

### Testing

```bash
bun run test
bun run test:coverage
bun run test:watch
```

### Package Structure

```
pkg/mysql/
├── MySQLProvider.ts       # Core MySQL provider implementation
├── index.ts               # Main entry point and exports
├── plugin.ts              # TokenRing plugin registration
├── package.json           # Package metadata and dependencies
├── vitest.config.ts       # Vitest test configuration
└── README.md              # Package documentation
```

### Build

```bash
bun run build
```

Runs TypeScript type checking with `tsc --noEmit`.

## Dependencies

| Package | Version | Description |
|---------|---------|-------------|
| `@tokenring-ai/app` | `0.2.0` | Base application framework and plugin system |
| `@tokenring-ai/database` | `0.2.0` | Abstract database provider and service |
| `mysql2` | `^3.20.0` | MySQL driver with promise support |
| `zod` | `^4.3.6` | Schema validation library |

### Dev Dependencies

| Package | Version | Description |
|---------|---------|-------------|
| `vitest` | `^4.1.1` | Test framework |
| `typescript` | `^6.0.2` | TypeScript compiler |

## Related Components

- `@tokenring-ai/database` - Base database abstraction and DatabaseService
- `@tokenring-ai/app` - Application framework for plugin integration
- `@tokenring-ai/utility` - KeyedRegistry and other utility functions

## License

MIT License - see [LICENSE](./LICENSE) file for details.
