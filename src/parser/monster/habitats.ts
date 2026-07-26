import { logger } from "../../lib/_module";
import DDBMonster from "../DDBMonster";

DDBMonster.prototype._generateHabitats = function _generateHabitats(this: DDBMonster) {

  const details = this.npc.system.details;
  if (!details) {
    logger.warn(`_generateHabitats: missing npc details for ${this.source.name}`);
    return;
  }

  const ddbValues = this.source.environments
    .map((env) => CONFIG.DDB.environments.find((c) => env == c.id)?.name)
    .filter((name): name is string => name !== undefined);

  const foundryValues = Object.keys(CONFIG.DND5E.habitats);

  const values: I5eHabitatEntry[] = [];
  const custom: string[] = [];

  for (const habitat of ddbValues) {
    const splitHabitat = habitat.split("(");
    const habitatName = splitHabitat[0].trim().toLowerCase();

    if (foundryValues.includes(habitatName)) {
      values.push({
        type: habitatName,
        subtype: splitHabitat.length > 1 ? splitHabitat[1].split(")")[0].trim() : null,
      });
    }
  }

  details.habitat = {
    value: values,
    custom: custom.join("; "),
  };
};
