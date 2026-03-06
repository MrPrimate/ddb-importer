import DDBMonster from "../DDBMonster";

DDBMonster.prototype._generateEnvironments = function _generateEnvironments(this: DDBMonster) {
  this.npc.system.details.environment = this.source.environments.filter((env) =>
    CONFIG.DDB.environments.some((c) => env == c.id),
  ).map((env) => {
    return CONFIG.DDB.environments.find((c) => env == c.id).name;
  }).join(", ");
};
