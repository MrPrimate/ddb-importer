import utils from "../../lib/utils.js";
import logger from "../../logger.js";
import { copySupportedItemFlags, srdFiddling } from "../../muncher/import.js";
import { buildNPC, copyExistingMonsterImages, generateIconMap } from "../../muncher/importMonster.js";
import DDBCompanion from "./DDBCompanion.js";

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
    this.updateCompanions = false; //  game.settings.get("ddb-importer", "munching-policy-update-existing");
    this.updateImages = false; // game.settings.get("ddb-importer", "munching-policy-update-images");
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
  };

  async #buildCompanion(block, options = {}) {
    logger.debug("Beginning companion parse", { block });
    const ddbCompanion = new DDBCompanion(block, mergeObject(options, { type: this.options.type }));
    // eslint-disable-next-line no-await-in-loop
    await ddbCompanion.parse();
    if (ddbCompanion.parsed) {
      this.companions.push(ddbCompanion);
    }
  }

  async parse() {
    // console.warn(this.doc);
    const statBlockDivs = this.doc.querySelectorAll("div.stat-block-background, div.stat-block-finder");

    // console.warn("statblkc divs", { statBlockDivs, athis: this });
    for (const block of statBlockDivs) {
      const name = block
        .querySelector("p.Stat-Block-Styles_Stat-Block-Title")
        .innerText
        .trim()
        .toLowerCase()
        .split(" ")
        .map((w) => utils.capitalize(w))
        .join(" ");

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


  static async updateCompanions(companions, existingCompanions) {
    return Promise.all(
      companions
        .filter((companion) =>
          existingCompanions.some(
            (exist) =>
              exist.flags?.ddbimporter?.id === companion.flags.ddbimporter.id
              && companion.flags?.ddbimporter?.entityTypeId === companion.flags.ddbimporter.entityTypeId
          )
        )
        .map(async (companion) => {
          const existingCompanion = await existingCompanions.find(
            (exist) =>
              exist.flags?.ddbimporter?.id === companion.flags.ddbimporter.id
              && companion.flags?.ddbimporter?.entityTypeId === companion.flags.ddbimporter.entityTypeId
          );
          companion.folder = existingCompanion.folder?.id;
          companion._id = existingCompanion._id;
          logger.info(`Updating companion ${companion.name}`);
          await copySupportedItemFlags(existingCompanion, companion);
          await buildNPC(companion, "monster", false, true, true);
          return companion;
        })
    );
  }

  static async createCompanions(companions, existingCompanions, folderId) {
    return Promise.all(
      companions
        .filter(
          (companion) =>
            !existingCompanions.some(
              (exist) =>
                exist.flags?.ddbimporter?.id === companion.flags.ddbimporter.id
                && companion.flags?.ddbimporter?.entityTypeId === companion.flags.ddbimporter.entityTypeId
            )
        )
        .map(async (companion) => {
          if (!game.user.can("ITEM_CREATE")) {
            ui.notifications.warn(`Cannot create Companion ${companion.name}`);
          } else {
            logger.info(`Creating Companion ${companion.name}`);
            if (folderId) companion.folder = folderId;
            const importedCompanions = await buildNPC(companion, "monster", false, false, true);
            return importedCompanions;
          }
          return companion;
        })
    );
  }

  async #generateCompanionFolders(rootFolderName = "DDB Companions") {
    const rootFolder = await utils.getOrCreateFolder(null, "Actor", rootFolderName);
    for (const companion of this.companions) {
      // eslint-disable-next-line no-await-in-loop
      const folder = await utils.getOrCreateFolder(rootFolder, "Actor", utils.capitalize(companion.type ?? "other"));
      companion.data.folder = folder._id;
      this.folderIds.add(folder._id);
    }
  }

  async updateOrCreateCompanions({ folderOverride = null, rootFolderNameOverride = undefined } = {}) {
    if (!folderOverride) await this.#generateCompanionFolders(rootFolderNameOverride);

    const existingCompanions = await game.actors.contents
      .filter((companion) => hasProperty(companion, "folder.id") && this.folderIds.has(companion.folder.id))
      .map((companion) => companion);

    let companionData = this.data;

    if (!this.updateCompanions || !this.updateImages) {
      if (!this.updateImages) {
        logger.debug("Copying monster images across...");
        companionData = copyExistingMonsterImages(companionData, existingCompanions);
      }
    }

    let finalCompanions = await srdFiddling(companionData, "monsters");
    await generateIconMap(finalCompanions);

    if (this.updateCompanions) await DDBCompanionFactory.updateCompanions(finalCompanions, existingCompanions);
    const importedCompanions = await DDBCompanionFactory.createCompanions(finalCompanions, existingCompanions, folderOverride?.id);

    // add companions to automated evocations list
    if (this.actor && game.modules.get("automated-evocations")?.active) {
      const currentAutomatedEvocationSettings = {
        isLocal: this.actor.getFlag("automated-evocations", "isLocal"),
        companions: this.actor.getFlag("automated-evocations", "isLocal"),
      };

      const companions = existingCompanions.concat(importedCompanions).map((companion) => {
        return {
          id: companion.id ? companion.id : companion._id,
          number: 1,
          animation: companion.flags?.ddbimporter?.automatedEvcoationAnimation
            ? companion.flags?.ddbimporter?.automatedEvcoationAnimation
            : "magic1",
        };
      });
      const newAutomatedEvocationSettings = {
        isLocal: true,
        companions,
      };
      const mergedSettings = mergeObject(currentAutomatedEvocationSettings, newAutomatedEvocationSettings);

      this.actor.setFlag("automated-evocations", "isLocal", mergedSettings.isLocal);
      this.actor.setFlag("automated-evocations", "companions", mergedSettings.companions);
    }
  }

}
