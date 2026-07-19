import { z } from "zod";

export const MySQLAccountSchema = z.object({
  host: z.string().meta({ description: "MySQL server host" }),
  port: z.number().default(3306).meta({ description: "MySQL server port" }),
  user: z.string().meta({ description: "MySQL username" }),
  password: z.string().meta({ sensitive: true, description: "MySQL password" }),
  databaseName: z.string().meta({ description: "Database name to connect to" }),
  connectionLimit: z.number().min(1).default(10).meta({ advanced: true, description: "Max concurrent connections in the pool" }),
  allowWrites: z.boolean().default(false).meta({ description: "Allow agents to run write queries against this account" }),
});

export const MySQLConfigSchema = z.object({
  accounts: z.record(z.string(), MySQLAccountSchema).default({}),
});

export type MySQLConfig = z.output<typeof MySQLConfigSchema>;
export type MySQLAccount = z.output<typeof MySQLAccountSchema>;
