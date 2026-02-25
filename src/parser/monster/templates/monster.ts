import { utils } from "../../../lib/_module";

export function newNPC(name, ddbId = null) {
  const options = {
    temporary: true,
    displaySheet: false,
  };
  const npcClass = new (Actor.implementation as any)({ name, type: "npc" }, options);
  const npc = npcClass.toObject();
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
