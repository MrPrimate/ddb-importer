import DDBEffectHelper from "../../../effects/DDBEffectHelper.mjs";
import { SUMMONS_ACTOR_STUB } from "./_data.mjs";

export async function getClairvoyance() {
  const condition = DDBEffectHelper.findCondition({ conditionName: "Invisible" });
  const results = {
    Clairvoyance: {
      name: "Invisible Sensor",
      version: "1",
      required: null,
      isJB2A: false,
      needsJB2A: false,
      folderName: "Clairvoyance",
      data: foundry.utils.mergeObject(foundry.utils.deepClone(SUMMONS_ACTOR_STUB()), {
        "name": "Invisible Sensor",
        "prototypeToken.name": "Invisible Sensor",
        "prototypeToken.texture.src": "icons/magic/perception/eye-tendrils-web-purple.webp",
        "img": "icons/magic/perception/eye-tendrils-web-purple.webp",
        "effects": [
          (await ActiveEffect.implementation.fromStatusEffect(condition.id)).toObject(),
        ],
      }),
    },
  };

  return results;
};
