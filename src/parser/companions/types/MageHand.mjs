import { utils } from "../../../lib/_module.mjs";
import { SUMMONS_ACTOR_STUB } from "./_data.mjs";

export function getMageHands() {

  return {
    MageHandRed: {
      name: "Mage Hand (Red)",
      version: "1",
      required: null,
      isJB2A: true,
      needsJB2A: false,
      folderName: "Mage Hand",
      data: foundry.utils.mergeObject(foundry.utils.deepClone(SUMMONS_ACTOR_STUB()), {
        "name": "Mage Hand (Red)",
        "prototypeToken.name": "Mage Hand",
        "prototypeToken.texture.src": "modules/ddb-importer/img/jb2a/ArcaneHand_Human_01_Idle_Red_400x400.webm",
        "img": "modules/ddb-importer/img/jb2a/ArcaneHand_Human_01_Idle_Red_Thumb.webp",
        "system": {
          "attributes": {
            "movement": {
              "fly": 30,
            },
          },
        },
      }),
    },
    MageHandPurple: {
      name: "Mage Hand (Purple)",
      version: "1",
      required: null,
      isJB2A: true,
      needsJB2A: true,
      folderName: "Mage Hand",
      data: foundry.utils.mergeObject(foundry.utils.deepClone(SUMMONS_ACTOR_STUB()), {
        "name": "Mage Hand (Purple)",
        "prototypeToken.name": "Mage Hand",
        "prototypeToken.texture.src": `${utils.getJB2APath()}/Library/5th_Level/Arcane_Hand/ArcaneHand_Human_01_Idle_Purple_400x400.webm`,
        "img": `${utils.getJB2APath()}/Library/5th_Level/Arcane_Hand/ArcaneHand_Human_01_Idle_Purple_Thumb.webp`,
        "system": {
          "attributes": {
            "movement": {
              "fly": 30,
            },
          },
        },
      }),
    },
    MageHandGreen: {
      name: "Mage Hand (Green)",
      version: "1",
      required: null,
      isJB2A: true,
      needsJB2A: true,
      folderName: "Mage Hand",
      data: foundry.utils.mergeObject(foundry.utils.deepClone(SUMMONS_ACTOR_STUB()), {
        "name": "Mage Hand (Green)",
        "prototypeToken.name": "Mage Hand",
        "prototypeToken.texture.src": `${utils.getJB2APath()}/Library/5th_Level/Arcane_Hand/ArcaneHand_Human_01_Idle_Green_400x400.webm`,
        "img": `${utils.getJB2APath()}/Library/5th_Level/Arcane_Hand/ArcaneHand_Human_01_Idle_Green_Thumb.webp`,
        "system": {
          "attributes": {
            "movement": {
              "fly": 30,
            },
          },
        },
      }),
    },
    MageHandBlue: {
      name: "Mage Hand (Blue)",
      version: "1",
      required: null,
      isJB2A: true,
      needsJB2A: true,
      folderName: "Mage Hand",
      data: foundry.utils.mergeObject(foundry.utils.deepClone(SUMMONS_ACTOR_STUB()), {
        "name": "Mage Hand (Blue)",
        "prototypeToken.name": "Mage Hand",
        "prototypeToken.texture.src": `${utils.getJB2APath()}/Library/5th_Level/Arcane_Hand/ArcaneHand_Human_01_Idle_Blue_400x400.webm`,
        "img": `${utils.getJB2APath()}/Library/5th_Level/Arcane_Hand/ArcaneHand_Human_01_Idle_Blue_Thumb.webp`,
        "system": {
          "attributes": {
            "movement": {
              "fly": 30,
            },
          },
        },
      }),
    },
    MageHandRock: {
      name: "Mage Hand (Rock)",
      version: "1",
      required: null,
      isJB2A: true,
      needsJB2A: true,
      needsJB2APatreon: true,
      folderName: "Mage Hand",
      data: foundry.utils.mergeObject(foundry.utils.deepClone(SUMMONS_ACTOR_STUB()), {
        "name": "Mage Hand (Rock)",
        "prototypeToken.name": "Mage Hand",
        "prototypeToken.texture.src": `${utils.getJB2APath()}/Library/5th_Level/Arcane_Hand/ArcaneHand_Human_01_Idle_Rock01_400x400.webm`,
        "img": `${utils.getJB2APath()}/Library/5th_Level/Arcane_Hand/ArcaneHand_Human_01_Idle_Rock01_Thumb.webp`,
        "system": {
          "attributes": {
            "movement": {
              "fly": 30,
            },
          },
        },
      }),
    },
    MageHandRainbow: {
      name: "Mage Hand (Rainbow)",
      version: "1",
      required: null,
      isJB2A: true,
      needsJB2A: true,
      needsJB2APatreon: true,
      folderName: "Mage Hand",
      data: foundry.utils.mergeObject(foundry.utils.deepClone(SUMMONS_ACTOR_STUB()), {
        "name": "Mage Hand (Rainbow)",
        prototypeToken: {
          name: "Mage Hand",
          "texture.src": `${utils.getJB2APath()}/Library/5th_Level/Arcane_Hand/ArcaneHand_Human_01_Idle_Rainbow_400x400.webm`,
        },
        "img": `${utils.getJB2APath()}/Library/5th_Level/Arcane_Hand/ArcaneHand_Human_01_Idle_Rainbow_Thumb.webp`,
        "system": {
          "attributes": {
            "movement": {
              "fly": 30,
            },
          },
        },
      }),
    },
  };
}
