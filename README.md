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
```

### Direct Usage

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

// Execute SQL queries
const result = await mysqlProvider.executeSql("SELECT * FROM users");
console.log(result.rows);
console.log(result.fields);

// Inspect database schema
const schema = await mysqlProvider.showSchema();
console.log(schema);
```

## Plugin Configuration

### Configuration Schema

```typescript
import { z } from "zod";

const packageConfigSchema = z.object({
  database: z.object({
    providers: z.record(z.string(), z.any())
  })
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

### Environment Variables

For production, consider using environment variables:

```bash
export MYSQL_HOST=localhost
export MYSQL_PORT=3306
export MYSQL_USER=root
export MYSQL_PASSWORD=your_password
export MYSQL_DATABASE=myapp
export MYSQL_CONNECTION_LIMIT=10
```

### Pool Configuration

The connection pool uses these internal settings:
- `waitForConnections: true` - Wait for available connections
- `queueLimit: 0` - Unlimited queue size
- `connectionLimit` - Configurable maximum connections (default: 10)

## Error Handling

The package provides comprehensive error handling:

- **Invalid Credentials**: Throws clear error messages for invalid MySQL credentials
- **Connection Failures**: Handles network issues with descriptive errors
- **SQL Errors**: Proper error handling for invalid SQL queries
- **Write Permissions**: Prevents write operations when `allowWrites` is false
- **Validation Errors**: Zod schema validation for all configuration options

## Integration

### TokenRing Plugin Integration

The package automatically registers MySQL providers when configured:

```typescript
const app = new TokenRingApp({
  plugins: [
    databasePlugin,
    mysqlPlugin
  ],
  config: {
    database: {
      providers: {
        mysql: {
          type: "mysql",
          host: process.env.MYSQL_HOST,
          port: parseInt(process.env.MYSQL_PORT),
          user: process.env.MYSQL_USER,
          password: process.env.MYSQL_PASSWORD,
          databaseName: process.env.MYSQL_DATABASE,
          connectionLimit: parseInt(process.env.MYSQL_CONNECTION_LIMIT)
        }
      }
    }
  }
});

await app.start();
```

### Agent Integration

Agents can access MySQL provider directly through the database service:

```typescript
// Access via DatabaseService
const databaseService = agent.requireServiceByType(DatabaseService);
const mysqlProvider = databaseService.getDatabaseByName("mymysql");
const result = await mysqlProvider.executeSql("SELECT * FROM users");
```

## Development

### Testing

```bash
bun run test
bun run test:coverage
```

### Package Structure

```
pkg/mysql/
├── MySQLProvider.ts      # Core MySQL provider implementation
├── index.ts              # Main entry point and exports
├── plugin.ts             # TokenRing plugin registration
├── package.json          # Package metadata and dependencies
├── vitest.config.ts      # Vitest test configuration
└── README.md             # Package documentation
```

### Contribution Guidelines

- Follow established coding patterns
- Write unit tests for new functionality
- Update documentation for new features
- Ensure all changes work with TokenRing agent framework

## License

MIT License - see [LICENSE](./LICENSE) file for details.
