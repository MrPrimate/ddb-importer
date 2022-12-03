
export function getType(ddb) {

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

  const type = CONFIG.DDB.monsterTypes.find((c) => ddb.typeId == c.id);
  if (!type) {
    result.custom = "Unknown";
    return result;
  }

  const typeName = type.name.toLowerCase();

  if (CONFIG.DND5E.creatureTypes[typeName]) result.value = typeName;

  result.subtype = CONFIG.DDB.monsterSubTypes
    .filter((c) => ddb.subTypes.includes(c.id))
    .map((c) => c.name)
    .join(", ");

  return result;

}
