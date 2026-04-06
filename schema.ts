import {z} from "zod";

export const MySQLAccountSchema = z.object({
  host: z.string(),
  port: z.number().default(3306),
  user: z.string(),
  password: z.string(),
  databaseName: z.string(),
  connectionLimit: z.number().default(10),
  allowWrites: z.boolean().default(false),
});

export const MySQLConfigSchema = z.object({
  accounts: z.record(z.string(), MySQLAccountSchema).default({}),
});

export type MySQLConfig = z.output<typeof MySQLConfigSchema>;
export type MySQLAccount = z.output<typeof MySQLAccountSchema>;
