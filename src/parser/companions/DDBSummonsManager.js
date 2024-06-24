import { DDBCompendiumFolders } from "../../lib/DDBCompendiumFolders.js";
import DDBItemImporter from "../../lib/DDBItemImporter.js";
import utils from "../../lib/utils.js";
import logger from "../../logger.js";
import { addNPC } from "../../muncher/importMonster.js";

const DANCING_LIGHTS_BASE = {
  "name": "Dancing Lights",
  "type": "npc",
  "img": "modules/ddb-importer/img/jb2a/DancingLights_01_Yellow_Thumb.webp",
  "system": {
    "abilities": {
      "str": {
        "value": 100,
      },
      "dex": {
        "value": 100,
      },
      "con": {
        "value": 100,
      },
      "int": {
        "value": 100,
      },
      "wis": {
        "value": 100,
      },
      "cha": {
        "value": 100,
      }
    },
    "attributes": {
      "movement": {
        "burrow": null,
        "climb": null,
        "fly": 60,
        "swim": null,
        "walk": null,
        "units": null,
        "hover": true
      },
      "ac": {
        "flat": 1000,
        "calc": "flat"
      },
      "hp": {
        "value": 1000,
        "max": 1000,
        "temp": 0,
        "tempmax": 0,
        "bonuses": {}
      },
    },
    "traits": {
      "size": "tiny",
    },
  },
  "items": [],
  "effects": [],
  "folder": null,
  "prototypeToken": {
    "name": "Dancing Lights",
    "displayName": 0,
    "actorLink": false,
    "appendNumber": true,
    "prependAdjective": false,
    "width": 0.5,
    "height": 0.5,
    "texture": {
      "src": "modules/ddb-importer/img/jb2a/DancingLights_01_Yellow_200x200.webm",
      "anchorX": 0.5,
      "anchorY": 0.5,
      "offsetX": 0,
      "offsetY": 0,
      "fit": "contain",
      "scaleX": 1,
      "scaleY": 1,
      "rotation": 0,
      "tint": "#ffffff",
      "alphaThreshold": 0.75
    },
    "hexagonalShape": 0,
    "lockRotation": false,
    "rotation": 0,
    "alpha": 1,
    "disposition": CONST.TOKEN_DISPOSITIONS.SECRET,
    "displayBars": 0,
    "bar1": {
      "attribute": null
    },
    "bar2": {
      "attribute": null
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
        "reverse": false
      },
      "darkness": {
        "min": 0,
        "max": 1
      }
    },
    "ring": {
      "enabled": false,
    },
    "randomImg": false,
  },
};

function getSummonActors() {
  const jb2aMod = game.modules.get('jb2a_patreon')?.active
    ? "jb2a_patreon"
    : "JB2A_DnD5e";
  return {
    DancingLightsYellow: {
      name: "Dancing Lights (Yellow)",
      version: "1",
      required: null,
      isJB2A: true,
      needsJB2A: false,
      folderName: "Dancing Lights",
      data: foundry.utils.mergeObject(foundry.utils.deepClone(DANCING_LIGHTS_BASE), {
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
      data: foundry.utils.mergeObject(foundry.utils.deepClone(DANCING_LIGHTS_BASE), {
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
      data: foundry.utils.mergeObject(foundry.utils.deepClone(DANCING_LIGHTS_BASE), {
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
      data: foundry.utils.mergeObject(foundry.utils.deepClone(DANCING_LIGHTS_BASE), {
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
      data: foundry.utils.mergeObject(foundry.utils.deepClone(DANCING_LIGHTS_BASE), {
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
      data: foundry.utils.mergeObject(foundry.utils.deepClone(DANCING_LIGHTS_BASE), {
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
      data: foundry.utils.mergeObject(foundry.utils.deepClone(DANCING_LIGHTS_BASE), {
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
}

const JB2A_LICENSE = `<p>The assets in this actor are kindly provided by JB2A and are licensed by <a href="https://creativecommons.org/licenses/by-nc-sa/4.0">Attribution-NonCommercial-ShareAlike 4.0 International</a>.</p>
<p>Check them out at <a href="https://jb2a.com">https://jb2a.com</a> they have a free and patreon supported Foundry module providing wonderful animations and assets for a variety of situations.</p>
<p>You can learn more about their Foundry modules <a href="https://jb2a.com/home/install-instructions/">here</a>.</p>`;


export default class DDBSummonsManager {

  constructor() {
    this.indexFilter = { fields: [
      "name",
      "flags.ddbimporter.compendiumId",
      "flags.ddbimporter.id",
      "flags.ddbimporter.summons",
    ] };
    this.itemHandler = null;
  }

  async init() {
    this.compendiumFolders = new DDBCompendiumFolders("summons");
    await this.compendiumFolders.loadCompendium("summons");

    this.itemHandler = new DDBItemImporter("summons", [], {
      indexFilter: this.indexFilter,
    });
    await this.itemHandler.init();
  }

  async addToCompendium(companion) {
    const results = [];
    if (!game.user.isGM) return results;
    const compendiumCompanion = foundry.utils.deepClone(companion);
    delete compendiumCompanion.folder;
    const folderName = this.compendiumFolders.getSummonFolderName(compendiumCompanion);
    const folder = await this.compendiumFolders.createSummonsFolder(folderName.name);
    compendiumCompanion.folder = folder._id;
    const npc = await addNPC(compendiumCompanion, "summons");
    results.push(npc);
    return results;
  }

  static async generateFixedSummons() {
    if (!game.user.isGM) return;
    const manager = new DDBSummonsManager();
    await manager.init();
    logger.debug("Generating Fixed summons");

    for (const [key, value] of Object.entries(getSummonActors())) {
      // check for JB2A modules
      if (value.needsJB2A
        && !game.modules.get('jb2a_patreon')?.active
        && !game.modules.get('JB2A_DnD5e')?.active
      ) continue;
      if (value.needsJB2APatreon && !game.modules.get('jb2a_patreon')?.active) continue;
      const existingSummons = manager.itemHandler.compendium.index.find((i) =>
        i.flags?.ddbimporter?.summons?.summonsKey === key
      );

      if (existingSummons && existingSummons.flags.ddbimporter.summons.version >= value.version) continue;

      // set summons data
      const companion = foundry.utils.deepClone(value.data);
      foundry.utils.setProperty(companion, "flags.ddbimporter.summons", {
        summonsKey: key,
        version: value.version,
        folder: value.folderName,
      });
      companion._id = utils.namedIDStub(value.name, { prefix: "ddbSum" });

      if (value.isJB2A) {
        foundry.utils.setProperty(companion, "system.details.biography", {
          value: JB2A_LICENSE,
          public: JB2A_LICENSE,
        });
      }

      logger.debug(`Creating ${key}`, companion);

      await manager.addToCompendium(companion);
    }
  }


}
