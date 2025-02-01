
import { SUMMONS_ACTOR_STUB } from "./_data.mjs";

export async function getArcaneEyes() {
  const results = {
    ArcaneEye: {
      name: "Arcane Eye",
      version: "1",
      required: null,
      isJB2A: true,
      needsJB2A: false,
      folderName: "Arcane Eye",
      data: foundry.utils.mergeObject(foundry.utils.deepClone(SUMMONS_ACTOR_STUB()), {
        "name": "Arcane Eye",
        "prototypeToken.name": "Arcane Eye",
        "prototypeToken.texture.src": "modules/ddb-importer/img/jb2a/Marker_01_Regular_BlueYellow_400x400.webm",
        "img": "modules/ddb-importer/img/jb2a/Marker_01_Regular_BlueYellow_Thumb.webp",
        "system": {
          "attributes": {
            "movement": {
              "fly": 30,
            },
          },
        },
        "effects": [
          (await ActiveEffect.implementation.fromStatusEffect("invisible")).toObject(),
        ],
      }),
    },
  };
  return results;
};
