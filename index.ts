import TokenRingApp from "@tokenring-ai/app";
import {DatabaseConfigSchema} from "@tokenring-ai/database";
import DatabaseService from "@tokenring-ai/database/DatabaseService";
import {TokenRingPlugin} from "@tokenring-ai/app";
import MySQLProvider from "./MySQLProvider.js";
import packageJSON from './package.json' with {type: 'json'};

export default {
  name: packageJSON.name,
  version: packageJSON.version,
  description: packageJSON.description,
  install(app: TokenRingApp) {
    const databaseConfig = app.getConfigSlice('database', DatabaseConfigSchema);
    if (databaseConfig) {
      app.waitForService(DatabaseService, databaseService => {
        for (const name in databaseConfig.providers) {
          const provider = databaseConfig.providers[name];
          if (provider.type === "mysql") {
            databaseService.registerDatabase(name, new MySQLProvider(provider));
          }
        }
      });
    }
  }
} as TokenRingPlugin;

export {default as MySQLProvider} from "./MySQLProvider.js";
