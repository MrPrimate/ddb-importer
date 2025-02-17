import { SUMMONS_ACTOR_STUB } from "./_data.mjs";

export function getIllusions() {
  const results = {
    IllusionObject: {
      name: "Object",
      version: "1",
      required: null,
      isJB2A: false,
      needsJB2A: false,
      folderName: "Illusions",
      data: foundry.utils.mergeObject(foundry.utils.deepClone(SUMMONS_ACTOR_STUB()), {
        name: "Illusionary Object",
        img: "icons/containers/barrels/barrel-chestnut-tan.webp",
        prototypeToken: {
          name: "Illusionary Object",
          texture: {
            src: "icons/containers/barrels/barrel-chestnut-tan.webp",
          },
        },
      }),
    },
    IllusionSound: {
      name: "Sound",
      version: "1",
      required: null,
      isJB2A: false,
      needsJB2A: false,
      folderName: "Illusions",
      data: foundry.utils.mergeObject(foundry.utils.deepClone(SUMMONS_ACTOR_STUB()), {
        name: "Illusionary Sound",
        img: "icons/magic/light/explosion-star-glow-blue-purple.webp",
        prototypeToken: {
          name: "Illusionary Sound",
          texture: {
            src: "icons/magic/light/explosion-star-glow-blue-purple.webp",
          },
        },
      }),
    },
    IllusionCreature: {
      name: "Creature",
      version: "1",
      required: null,
      isJB2A: false,
      needsJB2A: false,
      folderName: "Illusions",
      data: foundry.utils.mergeObject(foundry.utils.deepClone(SUMMONS_ACTOR_STUB()), {
        name: "Illusionary Creature",
        img: "icons/creatures/magical/spirit-undead-ghost-purple.webp",
        prototypeToken: {
          name: "Illusionary Creature",
          texture: {
            src: "icons/creatures/magical/spirit-undead-ghost-purple.webp",
          },
        },
      }),
    },
  };
  return results;
}
