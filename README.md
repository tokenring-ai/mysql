# @tokenring-ai/mysql

## Overview

MySQL database integration package for the TokenRing AI platform, providing connection pooling, SQL query execution, and schema inspection capabilities through a unified interface. This package extends the base `DatabaseProvider` from `@tokenring-ai/database` to offer MySQL-specific functionality and integrates seamlessly with the TokenRing ecosystem as a plugin.

## Installation

```bash
bun install @tokenring-ai/mysql @tokenring-ai/database mysql2
```

## Features

- **Connection Pooling**: Efficient connection management using `mysql2` with configurable limits
- **SQL Query Execution**: Execute raw SQL queries with proper result handling
- **Schema Inspection**: Retrieve CREATE TABLE statements for all database tables
- **Plugin Integration**: Seamlessly integrates with TokenRing applications via the plugin system
- **Type-Safe Configuration**: Zod-based schema validation for configuration
- **Write Operation Control**: Optional write permission enforcement
- **TypeScript Support**: Full TypeScript definitions and type safety

## Core Components

### MySQLProvider Class

The main class that provides MySQL database functionality.

#### Constructor

```typescript
constructor(props: MySQLResourceProps)
```

**Parameters:**

- `allowWrites` (boolean, optional): Whether to allow write operations (default: `false`)
- `host` (string): MySQL server hostname or IP address
- `port` (number, optional): MySQL port number (default: `3306`)
- `user` (string): Database username
- `password` (string): Database password
- `databaseName` (string): Name of the target database
- `connectionLimit` (number, optional): Maximum number of pooled connections (default: `10`)

#### Methods

##### executeSql

```typescript
async executeSql(sqlQuery: string): Promise<ExecuteSqlResult>
```

Executes a raw SQL query and returns the results.

**Returns:** `ExecuteSqlResult` object containing:
- `rows`: Array of row objects (`RowDataPacket[]`)
- `fields`: Array of field names (`string[]`)

**Example:**

```typescript
const result = await mysqlProvider.executeSql("SELECT * FROM users WHERE id = 1");
console.log(result.rows); // [{ id: 1, name: "John", email: "john@example.com" }]
console.log(result.fields); // ["id", "name", "email"]
```

##### showSchema

```typescript
async showSchema(): Promise<Record<string, string>>
```

Retrieves the CREATE TABLE statements for all tables in the database.

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

### DatabaseService Integration

The MySQL plugin registers MySQL providers with the `DatabaseService` when configured:

```typescript
// After plugin installation
const databaseService = app.services.find(s => s.name === "DatabaseService");
const mysqlProvider = databaseService.getDatabaseByName("mymysql");
```

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

- `type`: Must be `"mysql"`
- `host`: MySQL server hostname or IP address (required)
- `port`: MySQL port number (default: `3306`)
- `user`: Database username (required)
- `password`: Database password (required)
- `databaseName`: Name of the target database (required)
- `connectionLimit`: Maximum number of pooled connections (default: `10`)
- `allowWrites`: Whether to allow write operations (default: `false`)

### Pool Configuration

The connection pool uses these internal settings:
- `waitForConnections: true` - Wait for available connections
- `queueLimit: 0` - Unlimited queue size
- `connectionLimit` - Configurable maximum connections (default: 10)

## Agent Configuration

This package does not have any services with an `attach(agent: Agent)` method that merges in an agent config schema.

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

## RPC Endpoints

This package does not define RPC endpoints.

## State Management

This package does not have state slices or state management functionality.

## Error Handling

The package provides comprehensive error handling:

- **Invalid Credentials**: Throws clear error messages for invalid MySQL credentials
- **Connection Failures**: Handles network issues with descriptive errors
- **SQL Errors**: Proper error handling for invalid SQL queries
- **Write Permissions**: Prevents write operations when `allowWrites` is false
- **Validation Errors**: Zod schema validation for all configuration options

Common error scenarios:

| Error | Cause | Solution |
|-------|-------|----------|
| Connection timeout | Network issues or incorrect host/port | Verify host, port, and network connectivity |
| Authentication failure | Invalid credentials | Verify username, password, and MySQL user privileges |
| Database access error | Insufficient permissions | Ensure the user has proper permissions for the database |
| SQL syntax error | Invalid SQL query | Validate your SQL queries before execution |
| Connection pool exhaustion | Too many concurrent connections | Increase connectionLimit in configuration |

## Security Considerations

- Use environment variables for sensitive credentials
- Configure allowWrites carefully to prevent unauthorized modifications
- Consider using read-only users for agents that only need to query data
- Validate and sanitize all SQL input to prevent injection attacks
- Limit database access to necessary tables and operations based on agent requirements

## Development

### Testing

```bash
bun run test
bun run test:coverage
```

### Package Structure

```
pkg/mysql/
├── MySQLProvider.ts       # Core MySQL provider implementation
├── index.ts               # Main entry point and exports
├── plugin.ts              # TokenRing plugin registration
├── package.json           # Package metadata and dependencies
├── vitest.config.ts       # Vitest test configuration
└── README.md             # Package documentation
```

### Dependencies

- `@tokenring-ai/app` - Base application framework and plugin system
- `@tokenring-ai/database` - Abstract database provider and service
- `mysql2` - MySQL driver with promise support

## Related Components

- `@tokenring-ai/database` - Base database abstraction and DatabaseService
- `@tokenring-ai/app` - Application framework for plugin integration

## License

MIT License - see [LICENSE](./LICENSE) file for details.
