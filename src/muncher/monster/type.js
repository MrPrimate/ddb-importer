import { getSizeFromId } from "./size.js";

//   "value": "",
//   "subtype": "",
//   "swarm": {
//     "isSwarm": false,
//     "size": ""
//   },
//   "custom": ""


export function getType(monster) {

  const result = {
    "value": "",
    "subtype": "",
    "swarm": "",
    // "swarm": {
    //   "isSwarm": false,
    //   "size": ""
    // },
    "custom": ""
  };

  if (monster.swarm) {
    // result.swarm.isSwarm = true;
    // result.swarm.size = getSizeFromId(monster.swarm.sizeId).value;
    result.swarm = getSizeFromId(monster.swarm.sizeId).value;
  }

  const type = CONFIG.DDB.monsterTypes.find((c) => monster.typeId == c.id);
  if (!type) {
    result.custom = "Unknown";
    return result;
  }

  const typeName = type.name.toLowerCase();

  if (CONFIG.DND5E.creatureTypes[typeName]) result.value = typeName;

  result.subtype = CONFIG.DDB.monsterSubTypes
    .filter((c) => monster.subTypes.includes(c.id))
    .map((c) => c.name)
    .join(", ");

  return result;

}
