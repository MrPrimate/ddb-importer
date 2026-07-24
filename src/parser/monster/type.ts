import { logger, utils } from "../../lib/_module";
import DDBMonster from "../DDBMonster";

//   "value": "",
//   "subtype": "",
//   "swarm": {
//     "isSwarm": false,
//     "size": ""
//   },
//   "custom": ""


DDBMonster.prototype._generateType = function _generateType(this: DDBMonster) {

  const typeInfo = this.npc.system.details?.type;
  if (!typeInfo) {
    logger.warn(`_generateType: missing npc details type for ${this.source.name}`);
    return;
  }

  if (this.source.swarm) {
    // result.swarm.isSwarm = true;
    // result.swarm.size = getSizeFromId(monster.swarm.sizeId).value;
    typeInfo.swarm = this.getSizeFromId(this.source.swarm.sizeId).value;
  }

  const type = CONFIG.DDB.monsterTypes.find((c) => this.source.typeId == c.id);
  if (!type) {
    typeInfo.custom = "Unknown";
    this.typeName = "Unknown Monster";
  } else {
    this.typeName = type.name;
    const typeName = type.name.toLowerCase();

    if (CONFIG.DND5E.creatureTypes[typeName]) typeInfo.value = typeName;
  }

  typeInfo.subtype = CONFIG.DDB.monsterSubTypes
    .filter((c) => this.source.subTypes.includes(c.id))
    .map((c) => utils.capitalize(c.name))
    .join(", ");

};
