import { SUMMONS_ACTOR_STUB } from "./_data.mjs";

export async function getDuplicate() {

  if (foundry.utils.getProperty(CONFIG, "DDBI.parsed.Duplicate")) return {};

  const results = {
    IllusionaryDuplicate: {
      name: "Illusionary Duplicate",
      version: "1",
      required: null,
      isJB2A: false,
      needsJB2A: false,
      folderName: "Invoke Duplicity",
      data: foundry.utils.mergeObject(foundry.utils.deepClone(SUMMONS_ACTOR_STUB()), {
        name: "Illusionary Duplicate",
        img: "icons/creatures/magical/spirit-undead-ghost-purple.webp",
        prototypeToken: {
          name: "Illusionary Duplicate",
          texture: {
            src: "icons/creatures/magical/spirit-undead-ghost-purple.webp",
          },
        },
      }),
    },
  };

  await foundry.utils.setProperty(CONFIG, "DDBI.parsed.Duplicate", true);

  return results;
}
