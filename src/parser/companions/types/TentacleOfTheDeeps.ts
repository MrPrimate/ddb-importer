import { SUMMONS_ACTOR_STUB } from "./_data";

export async function getTentacleOfTheDeeps() {

  if (foundry.utils.getProperty(CONFIG, "DDBI.parsed.TentacleOfTheDeeps")) return {};

  const results = {
    TentacleOfTheDeeps: {
      name: "Tentacle of the Deeps",
      version: "1",
      required: null,
      isJB2A: false,
      needsJB2A: false,
      folderName: "Tentacle of the Deeps",
      data: foundry.utils.mergeObject(foundry.utils.deepClone(SUMMONS_ACTOR_STUB()), {
        name: "Tentacle of the Deeps",
        img: "icons/commodities/biological/tentacle-purple-white.webp",
        prototypeToken: {
          name: "Tentacle of the Deeps",
          texture: {
            src: "icons/commodities/biological/tentacle-purple-white.webp",
          },
        },
      }),
    },
  };

  await foundry.utils.setProperty(CONFIG, "DDBI.parsed.TentacleOfTheDeeps", true);

  return results;
}
