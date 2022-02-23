export async function newNPC(name) {
  const options = {
    temporary: true,
    displaySheet: false,
  };
  const npcClass = await Actor.create({ name, type: "npc" }, options);
  console.warn(npcClass);
  let npc = npcClass.data.toObject();
  console.warn(npc);
  const flags = {
    dnd5e: {},
    monsterMunch: {},
    ddbimporter: {
      dndbeyond: {},
    },
  };
  setProperty(npc, "flags", flags);
  delete npc._id;
  console.warn(npc);
  return npc;
};
