export async function newNPC(name) {
  const options = {
    temporary: true,
    displaySheet: false,
  };
  const npcClass = await Actor.create({ name, type: "npc" }, options);
  let npc = npcClass.toObject();
  npc._id = foundry.utils.randomID();
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
