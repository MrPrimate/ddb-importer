import utils from "../../../lib/utils.js";

export function newNPC(name, ddbId = null) {
  const options = {
    temporary: true,
    displaySheet: false,
  };
  const npcClass = new Actor.implementation({ name, type: "npc" }, options);
  let npc = npcClass.toObject();
  npc._id = ddbId === null
    ? foundry.utils.randomID()
    : utils.namedIDStub(npc.name, { postfix: ddbId });
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
