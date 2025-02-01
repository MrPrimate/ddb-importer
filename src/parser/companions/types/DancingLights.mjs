import { SUMMONS_ACTOR_STUB } from "./_data.mjs";
const DANCING_LIGHTS_BASE = {
  "name": "Dancing Lights",
  "img": "modules/ddb-importer/img/jb2a/DancingLights_01_Yellow_Thumb.webp",
  "system": {
    "attributes": {
      "movement": {
        "fly": 60,
      },
    },
  },

  "prototypeToken": {
    "name": "Dancing Lights",
    "width": 0.5,
    "height": 0.5,
    "texture": {
      "src": "modules/ddb-importer/img/jb2a/DancingLights_01_Yellow_200x200.webm",
    },
    "light": {
      "negative": false,
      "priority": 0,
      "alpha": 0.5,
      "angle": 360,
      "bright": 0,
      "color": null,
      "coloration": 1,
      "dim": 10,
      "attenuation": 0.5,
      "luminosity": 0.5,
      "saturation": 0,
      "contrast": 0,
      "shadows": 0,
      "animation": {
        "type": "torch",
        "speed": 3,
        "intensity": 3,
        "reverse": false,
      },
      "darkness": {
        "min": 0,
        "max": 1,
      },
    },
  },
};


export function getDancingLights(jb2aMod) {
  const dancingLightsBase = foundry.utils.mergeObject(foundry.utils.deepClone(SUMMONS_ACTOR_STUB()), foundry.utils.deepClone(DANCING_LIGHTS_BASE));
  const results = {
    DancingLightsYellow: {
      name: "Dancing Lights (Yellow)",
      version: "1",
      required: null,
      isJB2A: true,
      needsJB2A: false,
      folderName: "Dancing Lights",
      data: foundry.utils.mergeObject(foundry.utils.deepClone(dancingLightsBase), {
        "name": "Dancing Lights (Yellow)",
        "prototypeToken.texture.src": "modules/ddb-importer/img/jb2a/DancingLights_01_Yellow_200x200.webm",
        "prototypeToken.light": {
          "color": "#ffed7a",
          "alpha": 0.25,
        },
        "img": "modules/ddb-importer/img/jb2a/DancingLights_01_Yellow_Thumb.webp",
      }),
    },
    DancingLightsGreen: {
      name: "Dancing Lights (Green)",
      version: "1",
      required: null,
      isJB2A: true,
      needsJB2A: true,
      folderName: "Dancing Lights",
      data: foundry.utils.mergeObject(foundry.utils.deepClone(dancingLightsBase), {
        "name": "Dancing Lights (Green)",
        "prototypeToken.texture.src": `modules/${jb2aMod}/Library/Cantrip/Dancing_Lights/DancingLights_01_Green_200x200.webm`,
        "prototypeToken.light": {
          "color": "#a7ff7a",
          "alpha": 0.25,
        },
        "img": `modules/${jb2aMod}/Library/Cantrip/Dancing_Lights/DancingLights_01_Green_Thumb.webp`,
      }),
    },
    DancingLightsBlueTeal: {
      name: "Dancing Lights (Blue Teal)",
      version: "1",
      required: null,
      isJB2A: true,
      needsJB2A: true,
      folderName: "Dancing Lights",
      data: foundry.utils.mergeObject(foundry.utils.deepClone(dancingLightsBase), {
        "name": "Dancing Lights (Blue Teal)",
        "prototypeToken.texture.src": `modules/${jb2aMod}/Library/Cantrip/Dancing_Lights/DancingLights_01_BlueTeal_200x200.webm`,
        "prototypeToken.light": {
          "color": "#80ffff",
          "alpha": 0.25,
        },
        "img": `modules/${jb2aMod}/Library/Cantrip/Dancing_Lights/DancingLights_01_BlueTeal_Thumb.webp`,
      }),
    },
    DancingLightsBlueYellow: {
      name: "Dancing Lights (Blue Yellow)",
      version: "1",
      required: null,
      isJB2A: true,
      needsJB2A: true,
      folderName: "Dancing Lights",
      data: foundry.utils.mergeObject(foundry.utils.deepClone(dancingLightsBase), {
        "name": "Dancing Lights (Blue Yellow)",
        "prototypeToken.texture.src": `modules/${jb2aMod}/Library/Cantrip/Dancing_Lights/DancingLights_01_BlueYellow_200x200.webm`,
        "prototypeToken.light": {
          "color": "#c1e6e6",
          "alpha": 0.25,
        },
        "img": `modules/${jb2aMod}/Library/Cantrip/Dancing_Lights/DancingLights_01_BlueYellow_Thumb.webp`,
      }),
    },
    DancingLightsPink: {
      name: "Dancing Lights (Pink)",
      version: "1",
      required: null,
      isJB2A: true,
      needsJB2A: true,
      folderName: "Dancing Lights",
      data: foundry.utils.mergeObject(foundry.utils.deepClone(dancingLightsBase), {
        "name": "Dancing Lights (Pink)",
        "prototypeToken.texture.src": `modules/${jb2aMod}/Library/Cantrip/Dancing_Lights/DancingLights_01_Pink_200x200.webm`,
        "prototypeToken.light": {
          "color": "#f080ff",
          "alpha": 0.25,
        },
        "img": `modules/${jb2aMod}/Library/Cantrip/Dancing_Lights/DancingLights_01_Pink_Thumb.webp`,
      }),
    },
    DancingLightsPurpleGreen: {
      name: "Dancing Lights (Purple Green)",
      version: "1",
      required: null,
      isJB2A: true,
      needsJB2A: true,
      folderName: "Dancing Lights",
      data: foundry.utils.mergeObject(foundry.utils.deepClone(dancingLightsBase), {
        "name": "Dancing Lights (Purple Green)",
        "prototypeToken.texture.src": `modules/${jb2aMod}/Library/Cantrip/Dancing_Lights/DancingLights_01_PurpleGreen_200x200.webm`,
        "prototypeToken.light": {
          "color": "#a66bff",
          "alpha": 0.25,
        },
        "img": `modules/${jb2aMod}/Library/Cantrip/Dancing_Lights/DancingLights_01_PurpleGreen_Thumb.webp`,
      }),
    },
    DancingLightsRed: {
      name: "Dancing Lights (Red)",
      version: "1",
      required: null,
      isJB2A: true,
      needsJB2A: true,
      folderName: "Dancing Lights",
      data: foundry.utils.mergeObject(foundry.utils.deepClone(dancingLightsBase), {
        "name": "Dancing Lights (Red)",
        "prototypeToken.texture.src": `modules/${jb2aMod}/Library/Cantrip/Dancing_Lights/DancingLights_01_Red_200x200.webm`,
        "prototypeToken.light": {
          "color": "#ff817a",
          "alpha": 0.25,
        },
        "img": `modules/${jb2aMod}/Library/Cantrip/Dancing_Lights/DancingLights_01_Red_Thumb.webp`,
      }),
    },
  };

  return results;
}
