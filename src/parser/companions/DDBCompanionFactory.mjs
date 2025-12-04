import {
  utils,
  logger,
  DDBItemImporter,
  FolderHelper,
} from "../../lib/_module.mjs";
import DDBCompanion2014 from "./DDBCompanion2014.mjs";
import { isEqual } from "../../../vendor/lowdash/_module.mjs";
import DDBSummonsManager from "./DDBSummonsManager.mjs";
import { DDBBasicActivity } from "../enrichers/mixins/_module.mjs";
import DDBCompanion2024 from "./DDBCompanion2024.mjs";
import { CR_DATA } from "./types/CRSRD.mjs";
import { DICTIONARY } from "../../config/_module.mjs";
import { getFindFamiliarActivityData } from "./types/FindFamiliar.mjs";
import DDBMonsterFactory from "../DDBMonsterFactory.js";
import DDBMonsterImporter from "../../muncher/DDBMonsterImporter.mjs";


export default class DDBCompanionFactory {

  constructor(html, options = {}) {
    const defaultOptions = {
      originDocument: null,
      is2014: null,
      notifier: null,
      actor: null,
      data: null,
      folderHint: null,
      createCompanions: true,
      updateCompanions: true,
      updateImages: false,
    };
    // console.warn("html", html);
    this.options = Object.assign({}, defaultOptions, options);
    this.html = html;
    this.doc = new DOMParser().parseFromString(html.replaceAll("\n", ""), 'text/html');
    this.companions = [];
    this.actor = this.options.actor;
    this.folderIds = new Set();
    this.createCompanions = this.options.createCompanions;
    this.updateCompanions = this.options.updateCompanions; //  game.settings.get("ddb-importer", "munching-policy-update-existing");
    this.updateImages = this.options.updateImages; // game.settings.get("ddb-importer", "munching-policy-update-images");
    this.results = {
      created: [],
      updated: [],
    };
    this.originDocument = this.options.originDocument;
    this.originName = foundry.utils.getProperty(this.originDocument, "flags.ddbimporter.originalName")
      ?? this.originDocument?.name
      ?? null;
    this.is2014 = this.options.is2014;
    this.is2024 = !this.options.is2014 || this.options.is2024;
    this.summons = null;
    this.badSummons = false;
    this.noCompendiums = this.options.noCompendiums ?? false;
    this.indexFilter = { fields: [
      "name",
      "flags.ddbimporter.compendiumId",
      "flags.ddbimporter.id",
      "flags.ddbimporter.summons",
      "system.source.rules",
    ] };
    this.notifier = this.options.notifier;
    this.summonsManager = new DDBSummonsManager({ notifier: this.notifier });
    this.itemHandler = null;
  }

  async init() {
    await this.summonsManager.init();
    this.itemHandler = this.summonsManager.itemHandler;
  }

  get data() {
    return this.options.data ?? this.companions.map((c) => c.data);
  }

  static MULTI_2014 = DICTIONARY.companions.MULTI_COMPANIONS_2014;

  static MULTI_2024 = DICTIONARY.companions.MULTI_COMPANIONS_2024;

  async #buildCompanion(block, options = {}) {
    logger.debug("Beginning companion parse", { block });
    const finalOverrides = {
      rules: this.is2014 ? "2014" : "2024",
      type: this.options.type,
      folderHint: this.options.folderHint,
    };
    const finalOptions = foundry.utils.mergeObject(options, finalOverrides);

    const ddbCompanion = this.is2014
      ? new DDBCompanion2014(block, finalOptions)
      : new DDBCompanion2024(block, finalOptions);
    await ddbCompanion.parse();
    if (ddbCompanion.parsed) {
      this.companions.push(ddbCompanion);
      const companionSummons = foundry.utils.deepClone(ddbCompanion.summons);
      const existingSummons = this.summons
        ? foundry.utils.deepClone(this.summons)
        : null;
      const summonMatch = isEqual(companionSummons, existingSummons);

      // console.warn("Companion Parsed DISCOVERY", {
      //   ddbCompanion,
      //   companionSummons,
      //   existingSummons,
      //   summonMatch,
      //   this: this
      // });
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

  async _parse2014() {

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
      if (name && name in DDBCompanionFactory.MULTI_2014) {
        for (const subType of DDBCompanionFactory.MULTI_2014[name]) {
          await this.#buildCompanion(block, { name, subType });
        }
      } else {
        await this.#buildCompanion(block, { name, subType: null });
      }

    }

    return this.data;
  }

  async _parse2024() {

    await this.init();

    // console.warn(this.doc);
    const statBlockDivs = this.doc.querySelectorAll("div.stat-block");

    // console.warn("statblkc divs", { statBlockDivs, athis: this });
    for (const block of statBlockDivs) {
      const name = block
        .querySelector("h4.compendium-hr, h5.compendium-hr")
        .textContent
        .trim()
        .toLowerCase()
        .split(/\s/)
        .map((w) => utils.capitalize(w.trim()))
        .join(" ");

      if (name && name in DDBCompanionFactory.MULTI_2024) {
        for (const subType of DDBCompanionFactory.MULTI_2024[name]) {
          await this.#buildCompanion(block, { name, subType });
        }
      } else {
        await this.#buildCompanion(block, { name, subType: null });
      }

    }

    return this.data;
  }

  async parse() {
    if (this.is2014) await this._parse2014();
    else await this._parse2024();
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
    const npcBuilder = new DDBMonsterImporter({ monster: companion, type: "monster" });
    await npcBuilder.build({
      temporary: false,
      update,
      addToWorld: true,
    });
    const npc = this.data;
    results.push(npc);
    return results;
  }

  async #updateCompanions(companions, existingCompanions) {
    const updateCompanions = companions.filter((companion) =>
      existingCompanions.some(
        (exist) =>
          exist.flags?.ddbimporter?.id === companion.flags.ddbimporter.id
          && companion.flags?.ddbimporter?.entityTypeId === companion.flags.ddbimporter.entityTypeId
          && companion.system.source.rules === exist.system.source.rules,
      ));

    const results = [];

    // console.warn("Updating companions", { updateCompanions, existingCompanions, companions });
    for (const companion of updateCompanions) {
      const existingCompanion = await existingCompanions.find((exist) =>
        exist.flags?.ddbimporter?.id === companion.flags.ddbimporter.id
        && companion.flags?.ddbimporter?.entityTypeId === companion.flags.ddbimporter.entityTypeId
        && companion.system.source.rules === exist.system.source.rules,
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
          && companion.flags?.ddbimporter?.entityTypeId === companion.flags.ddbimporter.entityTypeId
          && companion.system.source.rules === exist.system.source.rules,
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
      this.itemHandler.documents = companionData;
      return;
    }

    if (!this.updateCompanions || !this.updateImages) {
      if (!this.updateImages) {
        logger.debug("Copying monster images across...");
        companionData = DDBMonsterFactory.copyExistingMonsterImages(companionData, existingCompanions);
      }
    }

    this.itemHandler.documents = companionData;
    await this.itemHandler.iconAdditions();
    await this.itemHandler.generateIconMap();

    if (this.updateCompanions) {
      this.results.updated = await this.#updateCompanions(this.itemHandler.documents, existingCompanions);
    }
    if (this.createCompanions) {
      this.results.created = await this.#createCompanions(this.itemHandler.documents, existingCompanions, folderOverride?.id);
    }
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

  async addCompanionsToDocuments(otherDocuments, activity = null, _enricherActivity = null) {
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
      activity,
      originDocument: updateDocument,
      profiles,
      activityProfiles: activity?.profiles,
      worldActors: summonActors,
      factory: this,
      summons: this.summons,
    });
    const summonsData = foundry.utils.deepClone(this.summons);
    if (!activity || activity.profiles.length === 0) {
      summonsData.profiles = profiles;
    } else {
      summonsData.profiles = activity.profiles;
    }

    if (activity) {
      if (activity.creatureTypes.length > 0) {
        summonsData.creatureTypes = activity.creatureTypes;
      }
      if (activity.creatureSizes.length > 0) {
        summonsData.creatureSizes = activity.creatureSizes;
      }
      if (activity.bonuses) {
        for (const [key, value] of Object.entries(activity.bonuses)) {
          if (value && value !== "") {
            summonsData.bonuses[key] = value;
          }
        }
      }
    }

    logger.debug("Final summons Data", {
      summonsData: foundry.utils.deepClone(summonsData),
      activity: foundry.utils.deepClone(activity),
      updateDocument: foundry.utils.deepClone(updateDocument),
    });

    const activityData = activity
      ? foundry.utils.mergeObject(activity, summonsData)
      : foundry.utils.mergeObject(this.#getDocumentActivity(updateDocument), summonsData);

    logger.debug("Final Activity Data", {
      activityData: foundry.utils.deepClone(activityData),
    });
    delete this.originDocument.system.activities[activityData._id];
    updateDocument.system.activities[activityData._id] = activityData;

  }

  async addCRSummoning(activity) {
    // console.warn("Adding CR Summoning", {
    //   this: this,
    //   originName: this.originName,
    //   activity,
    // });
    const summonsData = CR_DATA[this.originName]
      ? {
        summon: {
          prompt: true,
          mode: "cr",
        },
        profiles: CR_DATA[this.originName].profiles,
        creatureTypes: CR_DATA[this.originName].creatureTypes,
      }
      : DICTIONARY.companions.FIND_FAMILIAR_MATCHES.includes(this.originName)
        ? await getFindFamiliarActivityData(activity, this.options)
        : null;

    if (!summonsData) return;
    const activityData = foundry.utils.mergeObject(activity, summonsData);
    // console.warn("Final summons Activity Data", foundry.utils.deepClone(activityData));
    delete this.originDocument.system.activities[activity._id];
    this.originDocument.system.activities[activity._id] = activityData;
  }

}
