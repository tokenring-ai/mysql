# @tokenring-ai/mysql

A MySQL database integration package for the TokenRing AI platform, providing connection pooling, SQL query execution, and schema inspection capabilities.

## Overview

The `@tokenring-ai/mysql` package extends the base `DatabaseProvider` from `@tokenring-ai/database` to offer MySQL-specific functionality. It's designed as a plugin for the TokenRing ecosystem, automatically registering MySQL database providers based on configuration.

### Key Features

- **Connection Pooling**: Efficient connection management using `mysql2` with configurable limits
- **SQL Query Execution**: Execute raw SQL queries with proper result handling
- **Schema Inspection**: Retrieve CREATE TABLE statements for all database tables
- **Plugin Integration**: Seamlessly integrates with TokenRing applications via the plugin system
- **TypeScript Support**: Full TypeScript definitions and type safety

## Installation

```bash
npm install @tokenring-ai/mysql @tokenring-ai/database mysql2
```

## Usage

### As a TokenRing Plugin

The package is designed to work as a TokenRing plugin. Add it to your application configuration:

```typescript
import TokenRingApp from "@tokenring-ai/app";
import mysqlPlugin from "@tokenring-ai/mysql";

const app = new TokenRingApp();
app.use(mysqlPlugin);
```

### Configuration

Configure MySQL providers in your application's database configuration:

```typescript
// In your app configuration
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

### Direct Usage

You can also use the `MySQLProvider` class directly:

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

## API Reference

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

### Interfaces

#### MySQLResourceProps

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

#### ExecuteSqlResult

```typescript
interface ExecuteSqlResult {
  rows: RowDataPacket[];
  fields: string[];
}
```

## Package Structure

```
pkg/mysql/
├── index.ts              # Main entry point and plugin definition
├── MySQLProvider.ts      # Core MySQL provider implementation
├── package.json          # Package metadata and dependencies
├── README.md             # This documentation
└── LICENSE               # MIT license
```

## Dependencies

- **@tokenring-ai/database** (^0.1.0): Base `DatabaseProvider` class and types
- **mysql2** (^3.15.3): Promise-based MySQL client for Node.js

## Development

### Testing

Run the test suite:

```bash
npm test
```

### Building

The package uses TypeScript with ES modules. Build with:

```bash
npm run build
```

## Configuration Options

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

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## Notes

- The package assumes UTF-8 encoding for text data
- Binary data handling is not explicitly supported
- Connection pooling is managed automatically
- The plugin system handles registration and lifecycle management