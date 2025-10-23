import {AgentTeam, TokenRingPackage} from "@tokenring-ai/agent";
import {DatabaseConfigSchema} from "@tokenring-ai/database";
import DatabaseService from "@tokenring-ai/database/DatabaseService";
import MySQLProvider from "./MySQLProvider.js";
import packageJSON from './package.json' with {type: 'json'};

export default {
  name: packageJSON.name,
  version: packageJSON.version,
  description: packageJSON.description,
  install(agentTeam: AgentTeam) {
    const databaseConfig = agentTeam.getConfigSlice('database', DatabaseConfigSchema);
    if (databaseConfig) {
      agentTeam.services.waitForItemByType(DatabaseService).then(databaseService => {
        for (const name in databaseConfig.providers) {
          const provider = databaseConfig.providers[name];
          if (provider.type === "mysql") {
            databaseService.registerDatabase(name, new MySQLProvider(provider));
          }
        }
      });
    }
  }
} as TokenRingPackage;

export {default as MySQLProvider} from "./MySQLProvider.js";
