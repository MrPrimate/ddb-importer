import FolderHelper from "../../lib/FolderHelper.js";
import utils from "../../lib/utils.js";
import logger from "../../logger.js";
import DDBItemImporter from "../../lib/DDBItemImporter.js";
import { buildNPC, copyExistingMonsterImages, generateIconMap } from "../../muncher/importMonster.js";
import DDBCompanion from "./DDBCompanion.js";
import { isEqual } from "../../../vendor/lowdash/_module.js";
import DDBSummonsManager from "./DDBSummonsManager.js";
import CompendiumHelper from "../../lib/CompendiumHelper.js";
import { DDBBasicActivity } from "../enrichers/mixins/_module.mjs";

async function getFindFamiliarActivityData() {
  const ddbCompendium = CompendiumHelper.getCompendiumType("monster", false);
  await ddbCompendium?.getIndex();

  const activity = {
    "creatureTypes": [
      "celestial",
      "fey",
      "fiend",
    ],
    "profiles": [
      {
        "name": "Bat",
        "uuid": ddbCompendium?.index.find((i) => i.name === "Bat")?.uuid ?? "Compendium.dnd5e.monsters.Actor.qav2dvMIUiMQCCsy",
      },
      {
        "name": "Cat",
        "uuid": ddbCompendium?.index.find((i) => i.name === "Cat")?.uuid ?? "Compendium.dnd5e.monsters.Actor.hIf83RD3ZVW4Egfi",
      },
      {
        "name": "Crab",
        "uuid": ddbCompendium?.index.find((i) => i.name === "Crab")?.uuid ?? "Compendium.dnd5e.monsters.Actor.8RgUhb31VvjUNZU1",
      },
      {
        "name": "Fish",
        "uuid": ddbCompendium?.index.find((i) => i.name === "Quipper")?.uuid ?? "Compendium.dnd5e.monsters.Actor.nkyCGJ9wXeAZkyyz",
      },
      {
        "name": "Frog",
        "uuid": ddbCompendium?.index.find((i) => i.name === "Frog")?.uuid ?? "Compendium.dnd5e.monsters.Actor.EZgiprHXA2D7Uyb3",
      },
      {
        "name": "Hawk",
        "uuid": ddbCompendium?.index.find((i) => i.name === "Hawk")?.uuid ?? "Compendium.dnd5e.monsters.Actor.fnkPNfIpS62LqOu4",
      },
      {
        "name": "Lizard",
        "uuid": ddbCompendium?.index.find((i) => i.name === "Lizard")?.uuid ?? "Compendium.dnd5e.monsters.Actor.I2x01hzOjVN4NUjf",
      },
      {
        "name": "Octopus",
        "uuid": ddbCompendium?.index.find((i) => i.name === "Octopus")?.uuid ?? "Compendium.dnd5e.monsters.Actor.3UUNbGiG2Yf1ZPxM",
      },
      {
        "name": "Owl",
        "uuid": ddbCompendium?.index.find((i) => i.name === "Owl")?.uuid ?? "Compendium.dnd5e.monsters.Actor.d0prpsGSAorDadec",
      },
      {
        "name": "Poisonous Snake",
        "uuid": ddbCompendium?.index.find((i) => i.name === "Poisonous Snake")?.uuid ?? "Compendium.dnd5e.monsters.Actor.D5rwVIxmfFrdyyxT",
      },
      {
        "name": "Rat",
        "uuid": ddbCompendium?.index.find((i) => i.name === "Rat")?.uuid ?? "Compendium.dnd5e.monsters.Actor.pozQUPTnLZW8epox",
      },
      {
        "name": "Raven",
        "uuid": ddbCompendium?.index.find((i) => i.name === "Raven")?.uuid ?? "Compendium.dnd5e.monsters.Actor.LPdX5YLlwci0NDZx",
      },
      {
        "name": "Sea Horse",
        "uuid": ddbCompendium?.index.find((i) => i.name === "Sea Horse")?.uuid ?? "Compendium.dnd5e.monsters.Actor.FWSDiq9SZsdiBAa8",
      },
      {
        "name": "Spider",
        "uuid": ddbCompendium?.index.find((i) => i.name === "Spider")?.uuid ?? "Compendium.dnd5e.monsters.Actor.28gU50HtG8Kp7uIz",
      },
      {
        "name": "Weasel",
        "uuid": ddbCompendium?.index.find((i) => i.name === "Weasel")?.uuid ?? "Compendium.dnd5e.monsters.Actor.WOdeacKCYVhgLDuN",
      },
    ],
    "creatureSizes": [],
    "match": {
      "attacks": false,
      "proficiency": false,
      "saves": false,
    },
    summon: {
      identifier: "",
      mode: "",
      prompt: true,
    },
    "bonuses": {
      "ac": "",
      "hp": "",
      "attackDamage": "",
      "saveDamage": "",
      "healing": "",
    },
  };
  return activity;
}

const CR_DATA = {
  "Conjure Animals": {
    profiles: [
      {
        "count": "1 * floor((@item.level - 1) / 2)",
        "cr": "2",
        "types": ["beast"],
      },
      {
        "count": "2 * floor((@item.level - 1) / 2",
        "cr": "1",
        "types": ["beast"],
      },
      {
        "count": "4 * floor((@item.level - 1) / 2)",
        "cr": "0.5",
        "types": ["beast"],
      },
      {
        "count": "8 * floor((@item.level - 1) / 2)",
        "cr": "0.25",
        "types": ["beast"],
      },
    ],
    creatureTypes: ["beast"],
  },
  "Conjure Celestial": {
    profiles: [
      {
        "count": "1",
        "cr": "4",
        "level": {
          "min": null,
          "max": 8,
        },
        "types": ["celestial"],
      },
      {
        "count": "1",
        "cr": "5",
        "level": {
          "min": 9,
          "max": null,
        },
        "types": ["celestial"],
      },
    ],
    creatureTypes: [],
  },
  "Conjure Elemental": {
    profiles: [
      {
        "count": "1",
        "cr": "@item.level",
        "types": ["elemental"],
      },
    ],
    creatureTypes: ["elemental"],
  },
  "Conjure Fey": {
    profiles: [
      {
        "count": "1",
        "cr": "@item.level",
        "types": ["fey"],
      },
    ],
    creatureTypes: ["fey"],
  },
  "Conjure Minor Elementals": {
    profiles: [
      {
        "count": "1 * min(3, floor((@item.level - 2) / 2))",
        "cr": "2",
        "types": ["elemental"],
      },
      {
        "count": "2 * min(3, floor((@item.level - 2) / 2))",
        "cr": "1",
        "types": ["elemental"],
      },
      {
        "count": "4 * min(3, floor((@item.level - 2) / 2))",
        "cr": "0.5",
        "types": ["elemental"],
      },
      {
        "count": "8 * min(3, floor((@item.level - 2) / 2))",
        "cr": "0.25",
        "types": ["elemental"],
      },
    ],
    creatureTypes: [],
  },
  "Conjure Woodland Beings": {
    profiles: [
      {
        "count": "1 * min(3, floor((@item.level - 2) / 2))",
        "cr": "2",
        "types": ["fey"],
      },
      {
        "count": "2 * min(3, floor((@item.level - 2) / 2))",
        "cr": "1",
        "types": ["fey"],
      },
      {
        "count": "4 * min(3, floor((@item.level - 2) / 2))",
        "cr": "0.5",
        "types": ["fey"],
      },
      {
        "count": "8 * min(3, floor((@item.level - 2) / 2))",
        "cr": "0.25",
        "types": ["fey"],
      },
    ],
    creatureTypes: ["fey"],
  },
  "Summon Greater Demon": {
    profiles: [
      {
        "count": "1",
        "cr": "@item.level + 1",
        "types": ["fiend"],
      },
    ],
    creatureTypes: [],
  },
  "Summon Lesser Demons": {
    profiles: [
      {
        "count": "2 * min(3, floor((@item.level - 2) / 2))",
        "cr": "1",
        "types": ["fiend"],
      },
      {
        "count": "4 * min(3, floor((@item.level - 2) / 2))",
        "cr": "0.5",
        "types": ["fiend"],
      },
      {
        "count": "8 * min(3, floor((@item.level - 2) / 2))",
        "cr": "0.25",
        "types": ["fiend"],
      },
    ],
    creatureTypes: [],
  },
  "Infernal Calling": {
    profiles: [
      {
        "count": "1",
        "cr": "@item.level + 1",
        "types": ["fiend"],
      },
    ],
    creatureTypes: [],
  },
};

export default class DDBCompanionFactory {

  constructor(html, options = {}) {
    // console.warn("html", html);
    this.options = options;
    this.html = html;
    this.doc = new DOMParser().parseFromString(html.replaceAll("\n", ""), 'text/html');
    this.companions = [];
    this.actor = this.options.actor;
    this.folderIds = new Set();
    this.updateCompanions = true; //  game.settings.get("ddb-importer", "munching-policy-update-existing");
    this.updateImages = false; // game.settings.get("ddb-importer", "munching-policy-update-images");
    this.results = {
      created: [],
      updated: [],
    };
    this.originDocument = options.originDocument;
    this.originName = foundry.utils.getProperty(this.originDocument, "flags.ddbimporter.originalName") ?? this.originDocument.name;
    this.is2014 = options.is2014 ?? true;
    this.summons = null;
    this.badSummons = false;
    this.noCompendiums = options.noCompendiums ?? false;
    this.indexFilter = { fields: [
      "name",
      "flags.ddbimporter.compendiumId",
      "flags.ddbimporter.id",
      "flags.ddbimporter.summons",
    ] };
    this.summonsManager = new DDBSummonsManager();
    this.itemHandler = null;
  }

  async init() {
    await this.summonsManager.init();
    this.itemHandler = this.summonsManager.itemHandler;
  }

  get data() {
    return this.options.data ?? this.companions.map((c) => c.data);
  }

  static MULTI = {
    "Aberrant Spirit": ["Slaad", "Beholderkin", "Star Spawn"],
    "Bestial Spirit": ["Air", "Land", "Water"],
    "Celestial Spirit": ["Avenger", "Defender"],
    "Construct Spirit": ["Clay", "Metal", "Stone"],
    "Elemental Spirit": ["Air", "Earth", "Fire", "Water"],
    "Fey Spirit": ["Fuming", "Mirthful", "Tricksy"],
    "Fiendish Spirit": ["Demon", "Devil", "Yugoloth"],
    "Shadow Spirit": ["Fury", "Despair", "Fear"],
    "Undead Spirit": ["Ghostly", "Putrid", "Skeletal"],
    "Drake Companion": ["Acid", "Cold", "Fire", "Lightning", "Poison"],
    "Draconic Spirit": ["Chromatic", "Gem", "Metallic"],
    // "Primal Companion": ["Beast of the Land", "Beast of the Sea", "Beast of the Sky"],
  };

  async #buildCompanion(block, options = {}) {
    logger.debug("Beginning companion parse", { block });
    const ddbCompanion = new DDBCompanion(block, foundry.utils.mergeObject(options, { type: this.options.type }));
    await ddbCompanion.parse();
    if (ddbCompanion.parsed) {
      this.companions.push(ddbCompanion);
      const companionSummons = foundry.utils.deepClone(ddbCompanion.summons);
      const existingSummons = this.summons
        ? foundry.utils.deepClone(this.summons)
        : null;
      const summonMatch = isEqual(existingSummons, existingSummons);
      if (this.summons === null) {
        this.summons = foundry.utils.deepClone(ddbCompanion.summons);
      } else if (!summonMatch) {
        logger.error("Companion has different summons", {
          existingSummons,
          companionSummons,
          factory: this,
          ddbCompanion,
          equal: isEqual(existingSummons, existingSummons),
          summonMatch,
        });
        this.badSummons = false;
      }

    }
  }

  async parse() {

    await this.init();

    // console.warn(this.doc);
    const statBlockDivs = this.doc.querySelectorAll("div.stat-block-background, div.stat-block-finder, div.basic-text-frame");

    // console.warn("statblkc divs", { statBlockDivs, athis: this });
    for (const block of statBlockDivs) {
      const name = block
        .querySelector("p.Stat-Block-Styles_Stat-Block-Title")
        .textContent
        .trim()
        .toLowerCase()
        .split(/\s/)
        .map((w) => utils.capitalize(w.trim()))
        .join(" ");

      // console.warn("Processing Companion", { name, block });
      if (name && name in DDBCompanionFactory.MULTI) {
        for (const subType of DDBCompanionFactory.MULTI[name]) {
          await this.#buildCompanion(block, { name, subType });
        }
      } else {
        await this.#buildCompanion(block, { name, subType: null });
      }

    }

    return this.data;
  }

  async #generateCompanionFolders(rootFolderName = "DDB Companions") {
    const rootFolder = await FolderHelper.getOrCreateFolder(null, "Actor", rootFolderName);
    for (const companion of this.companions) {
      const folder = await FolderHelper.getOrCreateFolder(rootFolder, "Actor", utils.capitalize(companion.type ?? "other"));
      companion.data.folder = folder._id;
      this.folderIds.add(folder._id);
    }
  }

  async getExistingCompendiumCompanions() {
    await this.itemHandler.buildIndex(this.indexFilter);

    const existingCompanions = await Promise.all(this.itemHandler.compendiumIndex
      .filter((companion) => foundry.utils.hasProperty(companion, "flags.ddbimporter.id")
        && this.companions.some((c) => foundry.utils.getProperty(c, "data.flags.ddbimporter.id") === companion.flags.ddbimporter.id),
      )
      .map(async (companion) => this.itemHandler.compendium.getDocument(companion._id)),
    );

    return existingCompanions;
  }

  async getExistingWorldCompanions({ folderOverride = null, rootFolderNameOverride = undefined, limitToFactory = false } = {}) {
    if (game.user.isGM && !this.noCompendiums) return [];
    if (!folderOverride) await this.#generateCompanionFolders(rootFolderNameOverride);

    const companionNames = limitToFactory ? this.data.map((c) => c.name) : [];
    logger.debug("Matched companion names", companionNames);

    const existingCompanions = await game.actors.contents
      .filter((companion) => foundry.utils.hasProperty(companion, "folder.id")
        && ((!folderOverride && this.folderIds.has(companion.folder.id))
          || folderOverride?.id === companion.folder.id)
        && (!limitToFactory || (limitToFactory && companionNames.includes(companion.name))),
      )
      .map((companion) => companion);
    return existingCompanions;
  }

  static async addToWorld(companion, update) {
    const results = [];
    if (!game.user.can("ITEM_CREATE")) return results;
    const npc = await buildNPC(companion, "monster", false, update, true);
    results.push(npc);
    return results;
  }

  async #updateCompanions(companions, existingCompanions) {
    const updateCompanions = companions.filter((companion) =>
      existingCompanions.some(
        (exist) =>
          exist.flags?.ddbimporter?.id === companion.flags.ddbimporter.id
          && companion.flags?.ddbimporter?.entityTypeId === companion.flags.ddbimporter.entityTypeId,
      ));

    const results = [];

    for (const companion of updateCompanions) {
      const existingCompanion = await existingCompanions.find((exist) =>
        exist.flags?.ddbimporter?.id === companion.flags.ddbimporter.id
        && companion.flags?.ddbimporter?.entityTypeId === companion.flags.ddbimporter.entityTypeId,
      );
      companion.folder = existingCompanion.folder?.id;
      companion._id = existingCompanion._id;
      logger.info(`Updating companion ${companion.name}`);
      DDBItemImporter.copySupportedItemFlags(existingCompanion, companion);
      const npc = !this.noCompendiums
        ? await this.summonsManager.addToCompendium(companion)
        : await DDBCompanionFactory.addToWorld(companion, true);
      results.push(npc);
    }

    return results;
  }

  async #createCompanions(companions, existingCompanions, folderId) {
    if (!game.user.can("ITEM_CREATE")) {
      ui.notifications.warn(`User is unable to create world items, and cannot create companions`);
      return [];
    }
    const newCompanions = companions.filter((companion) =>
      !existingCompanions.some(
        (exist) =>
          exist.flags?.ddbimporter?.id === companion.flags.ddbimporter.id
          && companion.flags?.ddbimporter?.entityTypeId === companion.flags.ddbimporter.entityTypeId,
      ));

    const results = [];
    for (const companion of newCompanions) {
      logger.info(`Creating Companion ${companion.name}`);
      logger.debug(`Companion data:`, {
        companion,
        folderId,
      });

      if (folderId) companion.folder = folderId;
      const importedCompanion = game.user.isGM && !this.noCompendiums
        ? await this.summonsManager.addToCompendium(companion)
        : await DDBCompanionFactory.addToWorld(companion, false);
      results.push(importedCompanion);
    }
    return results;
  }

  async updateOrCreateCompanions({ folderOverride = null, rootFolderNameOverride = undefined } = {}) {
    const existingCompanions = this.noCompendiums
      ? await this.getExistingWorldCompanions({ folderOverride, rootFolderNameOverride })
      : await this.getExistingCompendiumCompanions();

    let companionData = this.data;

    if (!game.user.isGM) {
      return;
    }

    if (!this.updateCompanions || !this.updateImages) {
      if (!this.updateImages) {
        logger.debug("Copying monster images across...");
        companionData = copyExistingMonsterImages(companionData, existingCompanions);
      }
    }

    this.itemHandler.documents = companionData;
    await this.itemHandler.srdFiddling();
    await this.itemHandler.iconAdditions();

    await generateIconMap(this.itemHandler.documents);

    if (this.updateCompanions) {
      this.results.updated = await this.#updateCompanions(this.itemHandler.documents, existingCompanions);
    }
    this.results.created = await this.#createCompanions(this.itemHandler.documents, existingCompanions, folderOverride?.id);

  }


  static COMPANION_REMAP = {
    "Artificer Infusions": "Infusion: Homunculus Servant",
  };

  #getDocumentActivity(document = null) {
    const foundryDocument = document ?? this.originDocument;
    for (const id of Object.keys(foundryDocument.system.activities)) {
      const activity = foundryDocument.system.activities[id];
      if (activity.type === "summon") return activity;
    }
    const activity = new DDBBasicActivity({ type: "summon", foundryFeature: foundryDocument });
    activity.build();
    return activity.data;
  }

  async addCompanionsToDocuments(otherDocuments, activity = null) {
    if (!this.originDocument || !this.summons) return;
    const compendiumSummons = await this.getExistingCompendiumCompanions();
    const summonActors = compendiumSummons.length > 0
      ? compendiumSummons
      : await this.getExistingWorldCompanions({ limitToFactory: true });
    const profiles = summonActors
      .map((actor) => {
        return {
          _id: actor._id,
          name: actor.name,
          uuid: actor.uuid,
          count: null,
        };
      });
    const alternativeDocument = DDBCompanionFactory.COMPANION_REMAP[this.originName];
    const updateDocument = alternativeDocument
      ? (otherDocuments.find((s) =>
        s.name === alternativeDocument || s.flags.ddbimporter?.originalName === alternativeDocument,
      ) ?? this.originDocument)
      : this.originDocument;

    logger.debug("Companion Data Load", {
      originDocument: updateDocument,
      profiles,
      worldActors: summonActors,
      factory: this,
      summons: this.summons,
    });
    const summonsData = foundry.utils.deepClone(this.summons);
    summonsData.profiles = profiles;

    const activityData = activity
      ? foundry.utils.mergeObject(activity, summonsData)
      : foundry.utils.mergeObject(this.#getDocumentActivity(updateDocument), summonsData);
    delete this.originDocument.system.activities[activityData._id];
    updateDocument.system.activities[activityData._id] = activityData;

  }

  async addCRSummoning(activity) {
    const summonsData = CR_DATA[this.originName]
      ? {
        summon: {
          prompt: true,
          mode: "cr",
        },
        profiles: CR_DATA[this.originName].profiles,
        creatureTypes: CR_DATA[this.originName].creatureTypes,
      }
      : this.originName === "Find Familiar"
        ? await getFindFamiliarActivityData()
        : null;

    if (!summonsData) return;
    const activityData = foundry.utils.mergeObject(activity, summonsData);
    delete this.originDocument.system.activities[activity._id];
    this.originDocument.system.activities[activity._id] = activityData;
  }

}
