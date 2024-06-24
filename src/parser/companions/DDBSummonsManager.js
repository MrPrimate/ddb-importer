import { DDBCompendiumFolders } from "../../lib/DDBCompendiumFolders.js";
import DDBItemImporter from "../../lib/DDBItemImporter.js";
import utils from "../../lib/utils.js";
import { addNPC } from "../../muncher/importMonster.js";


const SUMMON_ACTORS = {
  DancingLists: {
    name: "Dancing Lights",
    version: "1",
    required: null,
    isJ2BA: true,
    // folderName: "Spells",
    data: {
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
            "type": null,
            "speed": 5,
            "intensity": 5,
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
    },
  },
};

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

    for (const [key, value] of Object.entries(SUMMON_ACTORS)) {
      const existingSummons = manager.itemHandler.compendium.index.find((i) =>
        i.flags?.ddbimporter?.summons?.summonsKey === key
      );

      console.warn("SUMMONS", {
        key,
        value,
        existingSummons,
        version: existingSummons?.flags?.ddbimporter?.summons?.version,
        eval: existingSummons && existingSummons.flags.ddbimporter.summons.version >= value.version,
        existing: existingSummons?.flags?.ddbimporter?.summons?.version,
        dataVersion: value.version,
        bool: existingSummons?.flags?.ddbimporter?.summons?.version >= value.version
      });
      if (existingSummons && existingSummons.flags.ddbimporter.summons.version >= value.version) continue;

      // set summons data
      const companion = foundry.utils.deepClone(value.data);
      foundry.utils.setProperty(companion, "flags.ddbimporter.summons", {
        summonsKey: key,
        version: value.version,
        folder: value.folderName,
      });
      companion._id = utils.namedIDStub(key, { prefix: "ddbSum" });

      if (value.isJ2BA) {
        foundry.utils.setProperty(companion, "system.details.biography", {
          value: JB2A_LICENSE,
          public: JB2A_LICENSE,
        });
      }

      await manager.addToCompendium(companion);
    }
  }


}
