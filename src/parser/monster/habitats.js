import DDBMonster from "../DDBMonster.js";

DDBMonster.prototype._generateHabitats = function _generateHabitats() {

  const ddbValues = this.source.environments.filter((env) =>
    CONFIG.DDB.environments.some((c) => env == c.id),
  ).map((env) => {
    return CONFIG.DDB.environments.find((c) => env == c.id).name;
  });

  const foundryValues = Object.keys(CONFIG.DND5E.habitats);

  const values = [];
  const custom = [];

  for (const habitat of ddbValues) {
    const splitHabitat = habitat.split("(");
    const habitatName = splitHabitat[0].trim().toLowerCase();
    const value = { type: null, subtype: null };

    if (foundryValues.includes(habitatName)) {
      value.type = habitatName;
      if (splitHabitat.length > 1) {
        value.subtype = splitHabitat[1].split(")")[0].trim();
      }
      values.push(value);
    }
  }

  this.npc.system.details.habitat = {
    value: values,
    custom: custom.join("; "),
  };
};
