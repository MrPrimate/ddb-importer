import FolderHelper from "../../lib/FolderHelper.js";
import utils from "../../lib/utils.js";
import logger from "../../logger.js";
import DDBItemImporter from "../../lib/DDBItemImporter.js";
import { buildNPC, copyExistingMonsterImages, generateIconMap } from "../../muncher/importMonster.js";
import DDBCompanion from "./DDBCompanion.js";
import { isEqual } from "../../../vendor/lowdash/isequal.js";

export default class DDBCompanionFactory {

  constructor(ddbCharacter, html, options = {}) {
    // console.warn("html", html);
    this.options = options;
    this.ddbCharacter = ddbCharacter;
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
    this.summons = null;
    this.badSummons = false;
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
    // eslint-disable-next-line no-await-in-loop
    await ddbCompanion.parse();
    if (ddbCompanion.parsed) {
      this.companions.push(ddbCompanion);
      if (this.summons === null) {
        this.summons = foundry.utils.deepClone(ddbCompanion.summons);
      } else if (!isEqual(this.summons, ddbCompanion.summons)) {
        logger.error("Companion has different summons", {
          summon: ddbCompanion.summons,
          factory: this,
          ddbCompanion,
        });
        this.badSummons = false;
      }

    }
  }

  async parse() {
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
          // eslint-disable-next-line no-await-in-loop
          await this.#buildCompanion(block, { name, subType });
        }
      } else {
        // eslint-disable-next-line no-await-in-loop
        await this.#buildCompanion(block, { name, subType: null });
      }

    }

    return this.data;
  }

  async #generateCompanionFolders(rootFolderName = "DDB Companions") {
    const rootFolder = await FolderHelper.getOrCreateFolder(null, "Actor", rootFolderName);
    for (const companion of this.companions) {
      // eslint-disable-next-line no-await-in-loop
      const folder = await FolderHelper.getOrCreateFolder(rootFolder, "Actor", utils.capitalize(companion.type ?? "other"));
      companion.data.folder = folder._id;
      this.folderIds.add(folder._id);
    }
  }

  async getExistingWorldCompanions({ folderOverride = null, rootFolderNameOverride = undefined, limitToFactory = false } = {}) {
    if (!folderOverride) await this.#generateCompanionFolders(rootFolderNameOverride);

    const companionNames = limitToFactory ? this.data.map((c) => c.name) : [];
    logger.debug("Matched companion names", companionNames);

    const existingCompanions = await game.actors.contents
      .filter((companion) => foundry.utils.hasProperty(companion, "folder.id")
        && ((!folderOverride && this.folderIds.has(companion.folder.id))
          || folderOverride?.id === companion.folder.id)
        && (!limitToFactory || (limitToFactory && companionNames.includes(companion.name)))
      )
      .map((companion) => companion);
    return existingCompanions;
  }

  static async updateCompanions(companions, existingCompanions) {
    const updateCompanions = companions.filter((companion) =>
      existingCompanions.some(
        (exist) =>
          exist.flags?.ddbimporter?.id === companion.flags.ddbimporter.id
          && companion.flags?.ddbimporter?.entityTypeId === companion.flags.ddbimporter.entityTypeId
      ));

    const results = [];

    for (const companion of updateCompanions) {
      // eslint-disable-next-line no-await-in-loop
      const existingCompanion = await existingCompanions.find((exist) =>
        exist.flags?.ddbimporter?.id === companion.flags.ddbimporter.id
        && companion.flags?.ddbimporter?.entityTypeId === companion.flags.ddbimporter.entityTypeId
      );
      companion.folder = existingCompanion.folder?.id;
      companion._id = existingCompanion._id;
      logger.info(`Updating companion ${companion.name}`);
      DDBItemImporter.copySupportedItemFlags(existingCompanion, companion);
      // eslint-disable-next-line no-await-in-loop
      const npc = await buildNPC(companion, "monster", false, true, true);
      results.push(npc);
    }

    return results;
  }

  static async createCompanions(companions, existingCompanions, folderId) {
    if (!game.user.can("ITEM_CREATE")) {
      ui.notifications.warn(`User is unable to create world items, and cannot create companions`);
      return [];
    }
    const newCompanions = companions.filter((companion) =>
      !existingCompanions.some(
        (exist) =>
          exist.flags?.ddbimporter?.id === companion.flags.ddbimporter.id
          && companion.flags?.ddbimporter?.entityTypeId === companion.flags.ddbimporter.entityTypeId
      ));

    const results = [];
    for (const companion of newCompanions) {
      logger.info(`Creating Companion ${companion.name}`);
      if (folderId) companion.folder = folderId;
      // eslint-disable-next-line no-await-in-loop
      const importedCompanion = await buildNPC(companion, "monster", false, false, true);
      results.push(importedCompanion);
    }
    return results;
  }

  async updateOrCreateCompanions({ folderOverride = null, rootFolderNameOverride = undefined } = {}) {
    const existingCompanions = await this.getExistingWorldCompanions({ folderOverride, rootFolderNameOverride });

    let companionData = this.data;

    if (!this.updateCompanions || !this.updateImages) {
      if (!this.updateImages) {
        logger.debug("Copying monster images across...");
        companionData = copyExistingMonsterImages(companionData, existingCompanions);
      }
    }

    const itemHandler = new DDBItemImporter("monsters", companionData);
    await itemHandler.srdFiddling();
    await itemHandler.iconAdditions();

    await generateIconMap(itemHandler.documents);

    if (this.updateCompanions) {
      this.results.updated = await DDBCompanionFactory.updateCompanions(itemHandler.documents, existingCompanions);
    }
    this.results.created = await DDBCompanionFactory.createCompanions(itemHandler.documents, existingCompanions, folderOverride?.id);

  }

}
