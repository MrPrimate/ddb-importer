import DDBMonster from "../DDBMonster.js";

//   "value": "",
//   "subtype": "",
//   "swarm": {
//     "isSwarm": false,
//     "size": ""
//   },
//   "custom": ""


DDBMonster.prototype._generateType = function _generateType() {

  if (this.source.swarm) {
    // result.swarm.isSwarm = true;
    // result.swarm.size = getSizeFromId(monster.swarm.sizeId).value;
    this.npc.system.details.type.swarm = this.getSizeFromId(this.source.swarm.sizeId).value;
  }

  const type = CONFIG.DDB.monsterTypes.find((c) => this.source.typeId == c.id);
  if (!type) {
    this.npc.system.details.type.custom = "Unknown";
    this.typeName = "Unknown Monster";
  } else {
    this.typeName = type.name;
    const typeName = type.name.toLowerCase();

    if (CONFIG.DND5E.creatureTypes[typeName]) this.npc.system.details.type.value = typeName;
  }

  this.npc.system.details.type.subtype = CONFIG.DDB.monsterSubTypes
    .filter((c) => this.source.subTypes.includes(c.id))
    .map((c) => c.name)
    .join(", ");

};
