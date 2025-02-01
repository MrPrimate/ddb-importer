import { SUMMONS_ACTOR_STUB } from "./_data.mjs";
export function getBubblingCauldrons() {
  return {
    TashasBubblingCauldron: {
      name: "Tasha's Bubbling Cauldron",
      version: "1",
      required: null,
      isJB2A: false,
      needsJB2A: false,
      needsJB2APatreon: false,
      folderName: "Tasha's Bubbling Cauldron",
      data: foundry.utils.mergeObject(foundry.utils.deepClone(SUMMONS_ACTOR_STUB()), {
        "name": "Bubbling Cauldron",
        "prototypeToken": {
          name: "Bubbling Cauldron",
          width: 1,
          height: 1,
          texture: {
            src: "icons/skills/toxins/cauldron-pot-bubbles-green.webp",
            scaleX: 0.5,
            scaleY: 0.5,
          },
        },
        "system.traits.size": "sm",
        img: "icons/skills/toxins/cauldron-pot-bubbles-green.webp",
      }),
    },
  };
}
