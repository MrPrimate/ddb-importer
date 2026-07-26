import { logger } from "../../lib/_module";
import DDBMonster from "../DDBMonster";

DDBMonster.prototype._generateEnvironments = function _generateEnvironments(this: DDBMonster) {
  const details = this.npc.system.details;
  if (!details) {
    logger.warn(`_generateEnvironments: missing npc details for ${this.source.name}`);
    return;
  }
  details.environment = this.source.environments
    .map((env) => CONFIG.DDB.environments.find((c) => env == c.id)?.name)
    .filter((name): name is string => name !== undefined)
    .join(", ");
};
