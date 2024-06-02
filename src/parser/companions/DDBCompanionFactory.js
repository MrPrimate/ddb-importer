/* eslint-disable no-await-in-loop */
import FolderHelper from "../../lib/FolderHelper.js";
import utils from "../../lib/utils.js";
import logger from "../../logger.js";
import DDBItemImporter from "../../lib/DDBItemImporter.js";
import { addNPC, buildNPC, copyExistingMonsterImages, generateIconMap } from "../../muncher/importMonster.js";
import DDBCompanion from "./DDBCompanion.js";
import { isEqual } from "../../../vendor/lowdash/isequal.js";
import { DDBCompendiumFolders } from "../../lib/DDBCompendiumFolders.js";
import { createDDBCompendium } from "../../hooks/ready/checkCompendiums.js";
import SETTINGS from "../../settings.js";

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
    this.compendiumFolders = null;
    this.noCompendiums = options.noCompendiums ?? false;
    this.itemHandler = new DDBItemImporter("summons", []);
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
    if (game.user.isGM) {
      const compData = SETTINGS.COMPENDIUMS.find((c) => c.title === "Summons");
      await createDDBCompendium(compData);
      this.compendiumFolders = new DDBCompendiumFolders("summons");
      await this.compendiumFolders.loadCompendium("summons");
    }

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
    await this.itemHandler.buildIndex({ fields: ["name", "flags.ddbimporter.compendiumId"] });

    const existingCompanions = await Promise.all(this.itemHandler.compendiumIndex
      .filter((companion) => foundry.utils.hasProperty(companion, "flags.ddbimporter.compendiumId")
        && this.companions.some((c) => foundry.utils.getProperty(c, "data.flags.ddbimporter.compendiumId") === companion.flags.ddbimporter.compendiumId)
      )
      .map(async (companion) => this.itemHandler.compendium.getDocument(companion._id))
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
        && (!limitToFactory || (limitToFactory && companionNames.includes(companion.name)))
      )
      .map((companion) => companion);
    return existingCompanions;
  }

  async #addToCompendium(companion) {
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
          && companion.flags?.ddbimporter?.entityTypeId === companion.flags.ddbimporter.entityTypeId
      ));

    const results = [];

    for (const companion of updateCompanions) {
      const existingCompanion = await existingCompanions.find((exist) =>
        exist.flags?.ddbimporter?.id === companion.flags.ddbimporter.id
        && companion.flags?.ddbimporter?.entityTypeId === companion.flags.ddbimporter.entityTypeId
      );
      companion.folder = existingCompanion.folder?.id;
      companion._id = existingCompanion._id;
      logger.info(`Updating companion ${companion.name}`);
      DDBItemImporter.copySupportedItemFlags(existingCompanion, companion);
      const npc = game.user.isGM && !this.noCompendiums
        ? await this.#addToCompendium(companion)
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
        ? await this.#addToCompendium(companion)
        : await DDBCompanionFactory.addToWorld(companion, false);
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

    this.itemHandler.documents = companionData;
    await this.itemHandler.srdFiddling();
    await this.itemHandler.iconAdditions();

    await generateIconMap(this.itemHandler.documents);

    if (this.updateCompanions) {
      this.results.updated = await this.#updateCompanions(this.itemHandler.documents, existingCompanions);
    }
    this.results.created = await this.#createCompanions(this.itemHandler.documents, existingCompanions, folderOverride?.id);

  }

}
