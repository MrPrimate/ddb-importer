import utils from "../../../lib/utils.js";

export async function newNPC(name, isLegacy) {
  const options = {
    temporary: true,
    displaySheet: false,
  };
  const npcClass = await Actor.create({ name, type: "npc" }, options);
  let npc = npcClass.toObject();
  // npc._id = foundry.utils.randomID();
  npc._id = utils.namedIDStub(`${npc.name}${isLegacy ? " Legacy" : ""}`);
  const flags = {
    dnd5e: {},
    monsterMunch: {},
    ddbimporter: {
      compendiumId: npc._id,
      dndbeyond: {},
    },
  };
  foundry.utils.setProperty(npc, "flags", flags);
  // delete npc._id;
  return npc;
};
