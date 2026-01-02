import {
  logger,
  utils,
  Iconizer,
  DDBItemImporter,
  FileHelper,
  CompendiumHelper,
  DDBMacros,
} from "../lib/_module.mjs";
import { DICTIONARY, SETTINGS } from "../config/_module.mjs";
import DDBCharacter from "../parser/DDBCharacter.js";
import { DDBDataUtils } from "../parser/lib/_module.mjs";
import { abilityOverrideEffects } from "../effects/abilityOverrides.js";
import { createInfusedItems, linkSelectedEnchantments } from "../parser/character/infusions.js";
import { setConditions } from "../parser/character/conditions.js";
import { ExternalAutomations } from "../effects/_module.mjs";

export default class DDBCharacterImporter {

  constructor({ actorId, ddbCharacter = null, notifier } = {}) {
    this.actor = game.actors.get(actorId);
    this.migrateMetadata();
    this.actorOriginal = foundry.utils.duplicate(this.actor);
    logger.debug("Current Actor (Original):", this.actorOriginal);
    this.result = {};
    this.nonMatchedItemIds = [];
    this.settings = {};
    this.ddbCharacter = ddbCharacter;
    this.notifier = notifier;

    if (!notifier) {
      this.notifier = (title, { message = false, isError = false } = {}) => {
        logger.info(title, { message, isError });
      };
    }
  }

  migrateMetadata() {
    if (this.actor.flags?.ddbimporter?.dndbeyond) {
      const url = this.actor.flags.ddbimporter.dndbeyond.url;

      if (url && !this.actor.flags.ddbimporter.characterId) {
        const characterId = DDBCharacter.getCharacterId(url);
        if (characterId) {
          this.actor.flags.ddbimporter.dndbeyond.characterId = characterId;
          this.actor.flags.ddbimporter.dndbeyond.url = url;
        } else {
          // clear the url, because it's malformed anyway
          this.actor.flags.ddbimporter.dndbeyond.url = null;
        }
      }
    }
  }


  static getCharacterUpdatePolicyTypes(invert = false) {
    let itemTypes = ["background", "race"];

    if (invert) {
      if (!game.settings.get("ddb-importer", "character-update-policy-class")) {
        itemTypes.push("class");
        itemTypes.push("subclass");
      }
      if (!game.settings.get("ddb-importer", "character-update-policy-feat")) itemTypes.push("feat");
      if (!game.settings.get("ddb-importer", "character-update-policy-weapon")) itemTypes.push("weapon");
      if (!game.settings.get("ddb-importer", "character-update-policy-equipment"))
        itemTypes = itemTypes.concat(DICTIONARY.types.equipment);
      if (!game.settings.get("ddb-importer", "character-update-policy-spell")) itemTypes.push("spell");
    } else {
      if (game.settings.get("ddb-importer", "character-update-policy-class")) {
        itemTypes.push("class");
        itemTypes.push("subclass");
      }
      if (game.settings.get("ddb-importer", "character-update-policy-feat")) itemTypes.push("feat");
      if (game.settings.get("ddb-importer", "character-update-policy-weapon")) itemTypes.push("weapon");
      if (game.settings.get("ddb-importer", "character-update-policy-equipment"))
        itemTypes = itemTypes.concat(DICTIONARY.types.equipment);
      if (game.settings.get("ddb-importer", "character-update-policy-spell")) itemTypes.push("spell");
    }
    return itemTypes;
  }


  /**
   * Filters the character items based on the user's selection in the settings.
   * The invert flag inverts the selection (i.e. instead of including the selected items, it excludes them)
   * @param {boolean} [invert=false] flag to invert the selection
   * @returns {object[]} the filtered array of items
   */
  filterItemsByUserSelection(invert = false) {
    let items = [];
    const validItemTypes = DDBCharacterImporter.getCharacterUpdatePolicyTypes(invert);

    for (const section of SETTINGS.FILTER_SECTIONS) {
      items = items.concat(this.result[section]).filter((item) => validItemTypes.includes(item.type));
    }
    return items;
  }

  filterActorItemsByUserSelection(invert = false) {
    const validItemTypes = DDBCharacterImporter.getCharacterUpdatePolicyTypes(invert);

    const items = this.actorOriginal.items.filter((item) => validItemTypes.includes(item.type));

    return items;
  }

  /**
   * Loops through a characters items and updates flags
   * @param {*} items
   */
  async copySupportedCharacterItemFlags(items) {
    items.forEach((item) => {
      const originalItem = this.actorOriginal.items.find(
        (originalItem) => item.name === originalItem.name && item.type === originalItem.type,
      );
      if (originalItem) {
        DDBItemImporter.copySupportedItemFlags(originalItem, item);
      }
    });
  }

  copyExistingJournalNotes() {
    if (!this.actorOriginal) return;
    const journalFields = [
      "notes1name",
      "notes2name",
      "notes3name",
      "notes4name",
      "notes1",
      "notes2",
      "notes3",
      "notes4",
      "notes",
    ];
    journalFields.forEach((field) => {
      if (this.actorOriginal.system.details[field]) {
        this.actor.system.details[field] = this.actorOriginal.system.details[field];
      }
    });
  }

  async copyCharacterItemEffects(items) {
    return new Promise((resolve) => {
      resolve(
        items.map((item) => {
          const originalItem = this.actorOriginal.items.find((originalItem) =>
            item.name === originalItem.name
            && item.type === originalItem.type
            && item.flags?.ddbimporter?.id === originalItem.flags?.ddbimporter?.id,
          );
          if (originalItem) {
            if (!item.effects) item.effects = [];
            if (originalItem.effects) {
              logger.info(`Copying Effects for ${originalItem.name}`);
              item.effects = originalItem.effects.map((m) => {
                delete m._id;
                return m;
              });
            }
          }
          return item;
        }),
      );
    });
  }

  static async removeItems(itemList, itemsToRemove) {
    return new Promise((resolve) => {
      resolve(
        itemList.filter(
          (item) =>
            !itemsToRemove.some((newItem) => {
              const originalNameMatch = newItem.flags?.ddbimporter?.originalItemName
                ? newItem.flags.ddbimporter.originalItemName === item.name
                : false;
              const nameMatch = item.name === newItem.name || originalNameMatch;
              const linkMatch = newItem.flags?.ddbimporter?.replacedId === item._id
                && item.flags?.ddbimporter?.overrideId === newItem.flags?.ddbimporter?.overrideId;
              return linkMatch || (nameMatch && item.type === newItem.type);
            }),
        ),
      );
    });
  }


  /**
   * Deletes items from the inventory bases on which sections a user wants to update
   * Possible sections:
   * - class
   * - feat
   * - weapon
   * - equipment
   * - inventory: consumable, loot, tool and container
   * - spell
   * @param {Array} excludedList list of items to not remove
   * @returns {Promise<Array<string>>} list of item ids removed
   */
  async clearItemsByUserSelection(excludedList = []) {
    const includedItems = DDBCharacterImporter.getCharacterUpdatePolicyTypes();
    // collect all items belonging to one of those inventory item categories
    const ownedItems = this.actor.getEmbeddedCollection("Item");
    const toRemove = ownedItems
      .filter(
        (item) =>
          includedItems.includes(item.type)
          && !excludedList.some((excluded) => excluded._id === item.id)
          && !this.nonMatchedItemIds.includes(item.id),
      )
      .filter((item) => !item.flags.ddbimporter?.ignoreItemImport)
      .map((item) => item.id);

    logger.debug("Removing the following character items", toRemove);
    if (toRemove.length > 0) {
      await this.actor.deleteEmbeddedDocuments("Item", toRemove, {
        itemsWithSpells5e: { alsoDeleteChildSpells: false },
      });
    }
    return toRemove;
  }

  async updateImage() {
    const data = this.ddbCharacter.source.ddb;
    logger.debug("Checking if image needs updating");
    // updating the image?
    let imagePath = this.actor.img;
    const decorations = data.character.decorations;
    const userHasPermission = !(game.settings.get("ddb-importer", "restrict-to-trusted") && !game.user.isTrusted);
    if (
      userHasPermission
      && decorations?.avatarUrl
      && decorations.avatarUrl !== ""
      && (!imagePath
        || this.settings.updatePolicyImage
        || utils.isDefaultOrPlaceholderImage(imagePath))
    ) {
      this.notifier("Uploading avatar image");
      const filename = utils.referenceNameString(`${data.character.id}-${data.character.name}`);

      const uploadDirectory = game.settings.get("ddb-importer", "image-upload-directory").replace(/^\/|\/$/g, "");
      imagePath = await FileHelper.uploadRemoteImage(decorations.avatarUrl, uploadDirectory, filename);
      this.result.character.img = imagePath;
      if (decorations?.frameAvatarUrl && decorations.frameAvatarUrl !== "") {
        const framePath = await FileHelper.uploadRemoteImage(decorations.frameAvatarUrl, uploadDirectory, `frame-${filename}`);
        this.result.character.flags.ddbimporter["framePath"] = framePath;
      }
    } else {
      this.result.character.img = this.actor.img;
    }

    if (utils.isDefaultOrPlaceholderImage(this.actorOriginal.prototypeToken.texture.src)) {
      foundry.utils.setProperty(this.result.character, "prototypeToken.texture.src", this.result.character.img);
    } else if (foundry.utils.hasProperty(this.actorOriginal, "prototypeToken.texture.src")) {
      // we only adjust the prototype token if we have an original
      foundry.utils.setProperty(this.result.character, "prototypeToken.texture.src", this.actorOriginal.prototypeToken.texture.src);
      foundry.utils.setProperty(this.result.character, "prototypeToken.texture.scaleX", this.actorOriginal.prototypeToken.texture.scaleX);
      foundry.utils.setProperty(this.result.character, "prototypeToken.texture.scaleY", this.actorOriginal.prototypeToken.texture.scaleY);
      foundry.utils.setProperty(this.result.character, "prototypeToken.texture.width", this.actorOriginal.prototypeToken.texture.width);
      foundry.utils.setProperty(this.result.character, "prototypeToken.texture.height", this.actorOriginal.prototypeToken.texture.height);
    }
  }


  async enrichCharacterItems(items) {

    await Iconizer.preFetchDDBIconImages();

    // if we still have items to add, add them
    if (items.length > 0) {
      this.notifier("Copying existing data flags");
      await this.copySupportedCharacterItemFlags(items);

      if (this.settings.activeEffectCopy) {
        this.notifier("Copying Item Active Effects");
        items = await this.copyCharacterItemEffects(items);
      }

      const iconizerSettings = {
        ddbItem: game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-use-ddb-item-icons"),
        inBuilt: game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-use-inbuilt-icons"),
        srdIcons: game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-use-srd-icons"),
        ddbSpell: game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-use-ddb-spell-icons"),
        ddbGenericItem: game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-use-ddb-generic-item-icons"),
        excludeCheck: true,
      };

      items = await Iconizer.updateIcons({
        settings: iconizerSettings,
        documents: items,
        srdIconUpdate: game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-use-srd-icons"),
      });
    }

    items = items.map((item) => {
      if (!item.effects) item.effects = [];
      const description = foundry.utils.getProperty(item, "system.description.value");
      if (description) {
        item.system.description.value = `<div class="ddb">
${description}
</div>`;
        item.system.description.chat = item.system.description.chat.trim() !== ""
          ? `<div class="ddb">
${item.system.description.chat}
</div>`
          : "";
      }
      return item;
    });

    return items;
  }

  async createCharacterItems(items, keepIds) {
    const options = foundry.utils.duplicate(SETTINGS.DISABLE_FOUNDRY_UPGRADE);
    if (keepIds) options["keepId"] = true;

    // we have to break these out into class and non-class because of
    // https://gitlab.com/foundrynet/foundryvtt/-/issues/5312
    const klassItems = items.filter((item) => ["class", "subclass"].includes(item.type));
    const nonKlassItems = items.filter((item) => !["class", "subclass"].includes(item.type));

    if (klassItems.length > 0) {
      logger.debug(`Adding the following class items, keep Ids? ${keepIds}`, { options, items: foundry.utils.duplicate(klassItems) });
      for (const klassItem of klassItems) {
        // console.warn(`Importing ${klassItem.name}`, klassItem);
        await this.actor.createEmbeddedDocuments("Item", [klassItem], options);
      }
    }
    if (nonKlassItems.length > 0) {
      logger.debug(`Adding the following non-class items, keep Ids? ${keepIds}`, { options, items: foundry.utils.duplicate(nonKlassItems) });
      if (CONFIG.DDBI.DEV.enabled && CONFIG.DDBI.DEV.itemImportSingle) {
        for (const nonKlassItem of nonKlassItems) {
          logger.info(`Importing ${nonKlassItem.name}`, nonKlassItem);
          await this.actor.createEmbeddedDocuments("Item", [nonKlassItem], options);
        }
      } else {
        await this.actor.createEmbeddedDocuments("Item", nonKlassItems, options);
      }

    }
  }

  async importCharacterItems(items, keepIds = false) {
    if (items.length > 0) {
      this.notifier("Adding items to character");

      const newItems = items.filter((i) => !i._id || i._id === null || i._id === undefined);
      const updateItems = items.filter((i) => i._id && i._id !== null && i._id !== undefined);

      await this.createCharacterItems(newItems, false);
      await this.createCharacterItems(updateItems, keepIds);
    }
  }

  async keepNonDDBItems(ddbItems) {
    const lastImportId = foundry.utils.getProperty(this.actorOriginal, "flags.ddbimporter.importId");
    if (this.settings.ignoreNonDDBItems) {
      const items = this.actor.getEmbeddedCollection("Item");
      await items.forEach((item) => {
        const ddbMatchedItem = ddbItems.some((ddbItem) =>
          item.name === ddbItem.name
          && item.type === ddbItem.type
          && item.flags?.ddbimporter?.id === ddbItem.flags?.ddbimporter?.id,
        );
        if (!ddbMatchedItem) {
          // if item not replaced by compendium swap or
          if (item.flags?.ddbimporter?.importId !== lastImportId) {
            this.nonMatchedItemIds.push(item.id);
          }
        }
      });
    }
  }

  static async getIndividualOverrideItems(overrideItems) {
    const label = CompendiumHelper.getCompendiumLabel("custom");
    const compendium = CompendiumHelper.getCompendium(label);

    const compendiumItems = await Promise.all(overrideItems
      .filter((item) => foundry.utils.hasProperty(item, "flags.ddbimporter.overrideId") && compendium.index.has(item.flags.ddbimporter.overrideId))
      .map(async (item) => {
        const compendiumItem = foundry.utils.duplicate(await compendium.getDocument(item.flags.ddbimporter.overrideId));
        foundry.utils.setProperty(compendiumItem, "flags.ddbimporter.pack", `${compendium.metadata.id}`);
        if (foundry.utils.hasProperty(item, "flags.ddbimporter.overrideItem")) {
          foundry.utils.setProperty(compendiumItem, "flags.ddbimporter.overrideItem", item.flags.ddbimporter.overrideItem);
        } else {
          foundry.utils.setProperty(compendiumItem, "flags.ddbimporter.overrideItem", {
            name: item.name,
            type: item.type,
            ddbId: item.flags.ddbimporter?.id,
          });
        }

        return compendiumItem;
      }));

    const matchingOptions = {
      looseMatch: false,
      monster: false,
      keepId: true,
      keepDDBId: true,
      overrideId: true,
      linkItemFlags: true,
    };
    const remappedItems = await DDBItemImporter.updateMatchingItems(overrideItems, compendiumItems, matchingOptions);

    return remappedItems;
  }

  static restoreDDBMatchedFlags(existingItem, item) {
    const ddbItemFlags = foundry.utils.getProperty(existingItem, "flags.ddbimporter");
    logger.debug(`Item flags for ${existingItem.name}`, ddbItemFlags);
    // we retain some flags that might change the nature of the import for this item
    // these flags are used elsewhere
    [
      "ignoreItemForChrisPremades",
      "ignoreItemImport",
      "ignoreItemUpdate",
      "overrideId",
      "overrideItem",
      "ddbCustomAdded",
    ].forEach((flag) => {
      if (foundry.utils.hasProperty(ddbItemFlags, flag)) {
        logger.debug(`Overriding ${flag} for ${item.name} to ${ddbItemFlags[flag]}`);
        foundry.utils.setProperty(item, `flags.ddbimporter.${flag}`, ddbItemFlags[flag]);
      }
    });
    // some items get ignored completly, if so we don't match these
    if (!foundry.utils.getProperty(ddbItemFlags, "ignoreItemImport") ?? false) {
      logger.debug(`Updating ${item.name} with id`);
      item["_id"] = existingItem["id"];
      if (foundry.utils.getProperty(ddbItemFlags, "ignoreIcon") ?? false) {
        logger.debug(`Retaining icons for ${item.name}`);
        item.flags.ddbimporter.matchedImg = existingItem.img;
        item.flags.ddbimporter.ignoreIcon = true;
      }
      if (foundry.utils.getProperty(ddbItemFlags, "retainResourceConsumption") ?? false) {
        logger.debug(`Retaining resources for ${item.name}`);
        for (const [key, activity] of Object.entries(item.system.activities)) {
          const original = foundry.utils.getProperty(existingItem.system.activities[key]);
          if (original) {
            activity.consumption = original.consumption;
            item.system.activities[key] = activity;
          }
        }
        item.system.uses.recovery = foundry.utils.deepClone(existingItem.system.uses.recovery);
        item.flags.ddbimporter.retainResourceConsumption = true;
        if (foundry.utils.hasProperty(existingItem, "flags.link-item-resource-5e") ?? false) {
          foundry.utils.setProperty(item, "flags.link-item-resource-5e", existingItem.flags["link-item-resource-5e"]);
        }
      }
      if (foundry.utils.getProperty(ddbItemFlags, "retainUseSpent") ?? false) {
        item.system.uses.spent = foundry.utils.deepClone(existingItem.system.uses.spent);
      }
    }
    if (foundry.utils.getProperty(ddbItemFlags, "ddbCustomAdded") ?? false) {
      item.system = foundry.utils.deepClone(existingItem.system);
      item.type = foundry.utils.deepClone(existingItem.type);
    }
    return item;
  }

  // checks for existing items, and depending on options will keep or replace with imported item
  async mergeExistingItems(items) {
    if (this.actorOriginal.flags.ddbimporter) {
      const ownedItems = this.actor.getEmbeddedCollection("Item");

      let nonMatchedItems = [];
      let matchedItems = [];

      for (let item of items) {
        let existingItem = DDBDataUtils.findMatchedDDBItem(item, ownedItems, matchedItems);
        logger.debug(`Checking ${item.name} for existing match`, existingItem);

        if (existingItem) {
          // we use flags on the item to determine if we keep various properties
          // NOW IS THE TIME!
          item = DDBCharacterImporter.restoreDDBMatchedFlags(existingItem, item);
          // we can now determine if we are going to ignore this item or not,
          // this effectively filters out the items we don't want and they don't
          // get returned from this function
          const ignoreItemImport = foundry.utils.getProperty(item, "flags.ddbimporter.ignoreItemImport") ?? false;
          if (!ignoreItemImport) {
            logger.debug(`Importing matched item ${item.name}`);
            matchedItems.push(item);
          }
        } else {
          nonMatchedItems.push(item);
        }
      }

      logger.debug("Finished retaining items");
      return nonMatchedItems.concat(matchedItems);
    } else {
      return items;
    }
  }

  async fetchCharacterItems() {
    // items for actor
    let items = [];

    logger.debug("Calculating items to create and update...");
    this.notifier("Calculating items to create and update...");
    items = this.filterItemsByUserSelection();

    logger.debug("Checking existing items for details...");
    this.notifier("Checking existing items for details...");

    items = await this.mergeExistingItems(items);
    await this.keepNonDDBItems(items);

    logger.debug("Removing found items...");
    this.notifier("Clearing items for recreation...");
    await this.clearItemsByUserSelection();

    const spellsAsActivities = game.settings.get(SETTINGS.MODULE_ID, "spells-on-items-as-activities");
    // If there is no magicitems module fall back to importing the magic
    // item spells as normal spells fo the character
    if (!spellsAsActivities) {
      logger.debug("No magic items module(s) found, adding spells to sheet.");
      items.push(
        this.result.itemSpells.filter((item) => {
          const active = item.flags.ddbimporter.dndbeyond && item.flags.ddbimporter.dndbeyond.active === true;
          if (!active) logger.info(`Missing active flag on item spell ${item.name}`);
          return active;
        }),
      );
      items = items.flat();
    }
    logger.debug("Finished item fetch");
    return items;
  }

  async processCharacterItems(items) {
    let compendiumItems = [];
    let overrideCompendiumItems = [];
    let individualCompendiumItems = [];

    // First we do items that are individually marked as override
    const individualOverrideItems = items.filter((item) => {
      const overrideId = foundry.utils.getProperty(item, "flags.ddbimporter.overrideId");
      return overrideId !== undefined && overrideId !== "NONE";
    });

    if (individualOverrideItems.length > 0) {
      const individualOverrideCompendiumItems = await DDBCharacterImporter.getIndividualOverrideItems(individualOverrideItems);
      individualCompendiumItems = individualOverrideCompendiumItems;
      // remove existing items from those to be imported
      logger.info("Removing matching Override compendium items");
      items = await DDBCharacterImporter.removeItems(items, individualCompendiumItems);
    }

    /**
     * First choice is override compendium
     */
    if (this.settings.useOverrideCompendiumItems) {
      logger.info("Removing matching Override compendium items");
      const compendiumOverrideItems = await DDBItemImporter.getCompendiumItems(items, "custom", { linkItemFlags: true });
      overrideCompendiumItems = compendiumOverrideItems;
      // remove existing items from those to be imported
      items = await DDBCharacterImporter.removeItems(items, overrideCompendiumItems);
    }

    if (this.settings.useExistingCompendiumItems) {
      logger.info("Removing compendium items");
      const compendiumFeatureItems = await DDBItemImporter.getCompendiumItems(items, "features");
      const compendiumInventoryItems = await DDBItemImporter.getCompendiumItems(items, "inventory");
      const compendiumSpellItems = await DDBItemImporter.getCompendiumItems(items, "spells");
      const compendiumClassItems = await DDBItemImporter.getCompendiumItems(items, "classes");
      const compendiumSubClassItems = await DDBItemImporter.getCompendiumItems(items, "subclasses");
      const compendiumRaceItems = await DDBItemImporter.getCompendiumItems(items, "races");
      const compendiumTraitsItems = await DDBItemImporter.getCompendiumItems(items, "traits");
      const compendiumBackgroundsItems = await DDBItemImporter.getCompendiumItems(items, "backgrounds");

      compendiumItems = compendiumItems.concat(
        compendiumInventoryItems,
        compendiumSpellItems,
        compendiumFeatureItems,
        compendiumClassItems,
        compendiumSubClassItems,
        compendiumRaceItems,
        compendiumTraitsItems,
        compendiumBackgroundsItems,
      );
      // remove existing items from those to be imported
      items = await DDBCharacterImporter.removeItems(items, compendiumItems);
    }

    // import remaining items to character
    if (items.length > 0) {
      this.notifier("Adding DDB generated items");
      logger.debug(`Adding DDB generated items...`, items);
      items = await this.enrichCharacterItems(items);
      await this.importCharacterItems(items, true);
    }

    // now import any compendium items that we matched
    if (this.settings.useExistingCompendiumItems) {
      this.notifier("Adding DDB compendium items");
      logger.info("Adding DDB compendium items:", compendiumItems);
      await this.createCharacterItems(compendiumItems, false);
    }

    if (this.settings.useOverrideCompendiumItems) {
      this.notifier("Adding Override compendium items");
      logger.info("Adding Override compendium items:", overrideCompendiumItems);
      await this.createCharacterItems(overrideCompendiumItems, false);
    }

    if (individualCompendiumItems.length > 0) {
      this.notifier("Adding Individual Override compendium items");
      logger.info("Adding Individual Override compendium items:", individualCompendiumItems);
      await this.createCharacterItems(individualCompendiumItems, false);
    }

    logger.debug("Finished importing items");
  }

  async preActiveEffects() {
    this.effectBackup = foundry.utils.duplicate(this.actor.effects);
    for (const e of this.effectBackup) {
      if (e.origin?.includes(".Item.")) {
        const parent = await fromUuid(e.origin);
        logger.debug("Effect Backup flags", { e, parent });
        if (parent) foundry.utils.setProperty(e, "flags.ddbimporter.type", parent.type);
      }
    }
    await this.actor.deleteEmbeddedDocuments("ActiveEffect", [], { deleteAll: true });
  }

  async processActiveEffects() {
    logger.debug("Removing active effects");

    // remove current active effects
    const excludedItems = this.filterActorItemsByUserSelection(true);
    const ignoredItemIds = this.actorOriginal.items
      .filter((item) =>
        item.effects
        && item.effects.length > 0
        && (item.flags.ddbimporter?.ignoreItemImport
          || excludedItems.some((ei) => ei._id === item._id)
          || this.nonMatchedItemIds.includes(item._id)
        ),
      )
      .map((item) => item._id);

    const itemEffects = this.effectBackup.filter((ae) =>
      ae.origin?.includes(".Item."),
    );
    const ignoredEffects = this.effectBackup.filter((ae) =>
      ignoredItemIds.includes(ae.origin?.split(".").slice(-1)[0]),
    );
    const coreStatusEffects = this.effectBackup.filter((ae) => {
      const isStatus = ae.statuses.length > 0;
      const itemEffect = ae.origin?.includes(".Item.");
      return isStatus && !itemEffect;
    });
    // effects on the character that are not from items, or corestatuses
    // nor added by ddb importer
    const charEffects = this.effectBackup.filter((ae) =>
      !ignoredItemIds.some((id) => ae._id === id)
      && !ae.flags.ddbimporter?.characterEffect
      && !ae.statuses.length > 0
      && !ae.origin?.includes(".Item."),
    );
    // effects that are added by the ddb importer that are not item effects
    const ddbGeneratedCharEffects = this.effectBackup.filter((ae) =>
      !ae.origin?.includes(".Item.") && ae.flags.ddbimporter?.characterEffect,
    );

    const spellEffects = [];
    for (const e of itemEffects) {
      const isOther = coreStatusEffects.some((ae) => ae._id === e._id)
        || charEffects.some((ae) => ae._id === e._id)
        || ddbGeneratedCharEffects.some((ae) => ae._id === e._id);
      if (!isOther && foundry.utils.getProperty(e, "flags.ddbimporter.type") === "spell") {
        spellEffects.push(e);
      }
    }

    const remainingEffects = this.effectBackup
      .filter((e) =>
        // remove existing active item effects
        !itemEffects.map((ae) => ae._id).includes(e._id)
        // clear down ddb generated character effects such as skill bonuses
        && !ddbGeneratedCharEffects.map((ae) => ae._id).includes(e._id)
        // ignored effects always remain
        && !ignoredEffects.map((ae) => ae._id).includes(e._id)
        // clear down char effects
        && !charEffects.map((ae) => ae._id).includes(e._id)
        // clear down status effects
        && !coreStatusEffects.map((ae) => ae._id).includes(e._id)
        // ignore spell effects
        && !spellEffects.map((ae) => ae._id).includes(e._id),
      );

    logger.debug("Effect Removal Results", {
      ignoredItemIds, itemEffects, ignoredEffects, charEffects, coreStatusEffects, spellEffects,
      ddbGeneratedCharEffects, remainingEffects, backupEffects: this.effectBackup,
    });

    // are we trying to retain existing effects?
    if (this.settings.activeEffectCopy) {
      // add retained character effects to result
      const effects = ignoredEffects.concat(charEffects, coreStatusEffects, spellEffects, remainingEffects);
      this.result.character.effects = this.result.character.effects.concat(effects);
    } else {
      this.result.character.effects = this.result.character.effects.concat(ignoredEffects);
    }
  }

  fixUpCharacterEffects() {
    // if (!CONFIG.ActiveEffect.legacyTransferral) return;
    let abilityOverrides = abilityOverrideEffects(this.result.character.flags.ddbimporter.dndbeyond.abilityOverrides);
    if (abilityOverrides.changes.length > 0) {
      this.result.character.effects = this.result.character.effects.concat(abilityOverrides);
    }
    this.result.character.effects = this.result.character.effects.filter((e) => e !== undefined);
    this.result.character.effects.forEach((effect) => {
      const origins = ["Ability.Override", "AC", `Actor.${this.actor.flags.ddbimporter.dndbeyond.characterId}`];
      if (origins.includes(effect.origin)) {
        effect.origin = `Actor.${this.actor.id}`;
      }
    });
  }

  async addImportIdToItems() {
    const importId = this.importId;
    function addImportId(items) {
      return items.map((item) => {
        foundry.utils.setProperty(item, "flags.ddbimporter.importId", importId);
        return item;
      });
    }
    this.result.actions = addImportId(this.result.actions);
    this.result.classes = addImportId(this.result.classes);
    this.result.features = addImportId(this.result.features);
    this.result.inventory = addImportId(this.result.inventory);
    this.result.itemSpells = addImportId(this.result.itemSpells);
    this.result.spells = addImportId(this.result.spells);
  }

  async resetActor() {
    await this.actor.deleteEmbeddedDocuments("Item", [], {
      deleteAll: true,
      itemsWithSpells5e: { alsoDeleteChildSpells: false },
    });
    await this.actor.deleteEmbeddedDocuments("ActiveEffect", [], { deleteAll: true });
    await this.actor.update(this.actorOriginal, { recursive: true, keepId: true });
  }

  getSettings() {
    this.settings = {
      updatePolicyName: game.settings.get("ddb-importer", "character-update-policy-name"),
      updatePolicyHP: game.settings.get("ddb-importer", "character-update-policy-hp"),
      updatePolicyHitDie: game.settings.get("ddb-importer", "character-update-policy-hit-die"),
      updatePolicyCurrency: game.settings.get("ddb-importer", "character-update-policy-currency"),
      updatePolicyBio: game.settings.get("ddb-importer", "character-update-policy-bio"),
      updatePolicyXP: game.settings.get("ddb-importer", "character-update-policy-xp"),
      updatePolicySpellUse: game.settings.get("ddb-importer", "character-update-policy-spell-use"),
      updatePolicyLanguages: game.settings.get("ddb-importer", "character-update-policy-languages"),
      updatePolicyImage: game.settings.get("ddb-importer", "character-update-policy-image"),
      activeEffectCopy: game.settings.get("ddb-importer", "character-update-policy-active-effect-copy"),
      addCharacterEffects: game.settings.get("ddb-importer", "character-update-policy-add-midi-effects"),
      ignoreNonDDBItems: game.settings.get("ddb-importer", "character-update-policy-ignore-non-ddb-items"),
      useExistingCompendiumItems: false, // game.settings.get("ddb-importer", "character-update-policy-use-existing"),
      useOverrideCompendiumItems: game.settings.get("ddb-importer", "character-update-policy-use-override"),
      useChrisPremades: game.settings.get("ddb-importer", "character-update-policy-use-chris-premades")
        && (game.modules.get("chris-premades")?.active ?? false),
      midiConfig: game.modules.get("midi-qol")?.active
        ? foundry.utils.deepClone(game.settings.get("midi-qol", "ConfigSettings"))
        : null,
    };
  }

  async resetHitPoints() {
    const hp = this.settings.updatePolicyHP
      ? this.result.character.system.attributes.hp
      : this.actorOriginal.system.attributes.hp;

    if (this.settings.updatePolicyHP) {
      const removedHitPoints = this.result.character.flags.ddbimporter.removedHitPoints ?? 0;
      const totalHP = this.result.character.flags.ddbimporter.totalHP ?? 0;
      hp.value = totalHP - removedHitPoints;
    }

    await this.actor.update({
      "system.attributes.hp": hp,
    });
  }

  async setSafeMidiQolConfig() {
    if (this.settings.midiConfig) {
      const newConfig = foundry.utils.deepClone(this.settings.midiConfig);
      newConfig.midiDeadCondition = "none";
      newConfig.midiUnconsciousCondition = "none";
      newConfig.addDead = "none";
      await game.settings.set("midi-qol", "ConfigSettings", newConfig);
    }
  }

  async restoreMidiQolConfig() {
    if (this.settings.midiConfig) {
      await game.settings.set("midi-qol", "ConfigSettings", this.settings.midiConfig);
    }
  }

  async processCharacterData() {
    this.getSettings();
    if (!CONFIG.DDBI.EFFECT_CONFIG.MODULES.configured) {
      // eslint-disable-next-line require-atomic-updates
      CONFIG.DDBI.EFFECT_CONFIG.MODULES.configured = await DDBMacros.configureDependencies();
    }
    this.setSafeMidiQolConfig();
    this.result = foundry.utils.deepClone(this.ddbCharacter.data);

    // disable active sync
    const activeUpdateState = this.ddbCharacter.getCurrentDynamicUpdateState();
    await this.ddbCharacter.disableDynamicUpdates();

    try {
      this.importId = foundry.utils.randomID();
      foundry.utils.setProperty(this.result.character, "flags.ddbimporter.importId", this.importId);
      await this.addImportIdToItems();

      // handle active effects
      this.notifier("Calculating Active Effect Changes");
      this.fixUpCharacterEffects();
      await this.preActiveEffects();
      // we need to process the items first to find out if we are ignoring any effects
      let items = await this.fetchCharacterItems();
      await this.processActiveEffects();

      // update image
      await this.updateImage();

      // manage updates of basic character data more intelligently
      // revert some data if update not wanted
      if (!this.settings.updatePolicyName) {
        this.result.character.name = this.actorOriginal.name;
        this.result.character.prototypeToken.name = this.actorOriginal.prototypeToken.name;
      }
      if (!this.settings.updatePolicyHP) {
        this.result.character.system.attributes.hp = this.actorOriginal.system.attributes.hp;
      }
      if (!this.settings.updatePolicyXP) {
        this.result.character.system.details.xp = this.actorOriginal.system.details.xp;
      }
      if (!this.settings.updatePolicyHitDie) {
        this.result.character.system.attributes.hd = this.actorOriginal.system.attributes.hd;
        this.result.classes = this.result.classes.map((klass) => {
          const originalKlass = this.actorOriginal.items.find(
            (original) => original.name === klass.name && original.type === "class",
          );
          if (originalKlass) {
            klass.system.hd.spent = originalKlass.system.hd.spent;
          }
          return klass;
        });
      }
      if (!this.settings.updatePolicyCurrency) {
        this.result.character.system.currency = this.actorOriginal.system.currency;
      }
      if (!this.settings.updatePolicyBio) {
        const bioUpdates = ["alignment", "appearance", "background", "biography", "bond", "flaw", "ideal", "trait"];
        bioUpdates.forEach((option) => {
          this.result.character.system.details[option] = this.actorOriginal.system.details[option];
        });
      }
      if (!this.settings.updatePolicySpellUse) {
        this.result.character.system.spells = this.actorOriginal.system.spells;
      }
      if (!this.settings.updatePolicyLanguages) {
        this.result.character.system.traits.languages = this.actorOriginal.system.traits.languages;
      }
      // if resource mode is in disable and not asking, then we use the previous resources
      const resourceFlags = foundry.utils.getProperty(this.result.character, "flags.ddbimporter.resources");
      if (resourceFlags.type === "disable") {
        this.result.character.system.resources = foundry.utils.duplicate(this.actorOriginal.system.resources);
      }

      // flag as having items ids
      this.result.character.flags.ddbimporter["syncItemReady"] = true;
      this.result.character.flags.ddbimporter["syncActionReady"] = true;
      this.result.character.flags.ddbimporter["activeUpdate"] = false;
      this.result.character.flags.ddbimporter["activeSyncSpells"] = true;
      // remove unneeded flags (used for character parsing)
      this.result.character.flags.ddbimporter.dndbeyond["templateStrings"] = null;
      this.result.character.flags.ddbimporter.dndbeyond["characterValues"] = null;
      this.result.character.flags.ddbimporter.dndbeyond["proficiencies"] = null;
      this.result.character.flags.ddbimporter.dndbeyond["proficienciesIncludingEffects"] = null;
      this.result.character.flags.ddbimporter.dndbeyond["effectAbilities"] = null;
      this.result.character.flags.ddbimporter.dndbeyond["abilityOverrides"] = null;
      foundry.utils.setProperty(this.result.character.flags, "ddb-importer.version", CONFIG.DDBI.version);

      if (this.actorOriginal.flags.dnd5e?.wildMagic === true) {
        this.result.character.flags.dnd5e["wildMagic"] = true;
      }

      // midi fixes
      const actorOnUseMacroName = foundry.utils.getProperty(this.result.character, "flags.midi-qol.onUseMacroName");
      if (!actorOnUseMacroName || actorOnUseMacroName === "") {
        foundry.utils.setProperty(this.result.character, "flags.midi-qol.onUseMacroName", "[postActiveEffects]");
      }

      // basic import
      this.notifier("Updating core character information");
      logger.debug("Character data importing: ", this.result.character);
      await this.actor.update(this.result.character);

      // copy existing journal notes
      this.copyExistingJournalNotes();

      // items import
      await this.processCharacterItems(items);

      if (this.settings.activeEffectCopy) {
        // find effects with a matching name that existed on previous actor
        // and that have a different active state and activate them
        const targetEffects = this.actor.effects.filter((ae) => {
          const previousEffectDiff = this.actorOriginal.effects.find(
            (oae) => oae.name === ae.name && oae.disabled !== ae.disabled,
          );
          if (previousEffectDiff) return true;
          return false;
        });
        const updatedEffects = targetEffects.map((ae) => {
          return { _id: ae._id, disabled: !ae.disabled };
        });
        await this.actor.updateEmbeddedDocuments("ActiveEffect", updatedEffects);
      }

      const favorites = foundry.utils.deepClone(this.actorOriginal.system.favorites ?? []);
      if (favorites.length > 0) {
        await this.actor.update({ system: { favorites } });
      }

      this.notifier(`Consumption linking...`);
      await this.ddbCharacter.autoLinkConsumption();

      // add infusions to actors items
      await createInfusedItems(this.ddbCharacter.source.ddb, this.actor);
      await linkSelectedEnchantments(this.actor);

      if (this.settings.useChrisPremades) {
        this.notifier(`Applying CPR...`);
        await ExternalAutomations.addChrisEffectsToActorDocuments(this.actor);
      }
      this.notifier(`Updating conditions...`);
      await setConditions(this.actor, this.ddbCharacter.source.ddb, this.settings.activeEffectCopy);

      this.resetHitPoints();

    } catch (error) {
      logger.error("Error importing character: ", { error, ddbCharacter: this.ddbCharacter, result: this.result });
      logger.error(error.stack);
      this.notifier("Error importing character, attempting rolling back, see console (F12) for details.", { message: error, isError: true });
      await this.resetActor();
      throw new Error("ImportFailure");
    } finally {
      await this.ddbCharacter.updateDynamicUpdates(activeUpdateState);
      await this.restoreMidiQolConfig();
      this.actor.render();
    }

    await Hooks.callAll("ddb-importer.characterProcessDataComplete", { actor: this.actor, ddbCharacter: this.ddbCharacter });
  }


  async importCharacter({ characterId } = {}) {

    try {
      this.notifier("Getting Character data");
      const derivedCharacterId = characterId ?? this.actor.flags.ddbimporter.dndbeyond.characterId;
      const ddbCharacterOptions = {
        currentActor: this.actor,
        characterId: derivedCharacterId,
        selectResources: true,
        enableCompanions: true,
      };
      const getOptions = {
        syncId: null,
        localCobaltPostFix: this.actor.id,
      };
      CONFIG.DDBI.keyPostfix = this.actor.id;
      CONFIG.DDBI.useLocal = foundry.utils.getProperty(this.actor, "flags.ddbimporter.useLocalPatreonKey") ?? false;
      this.ddbCharacter = new DDBCharacter(ddbCharacterOptions);
      await this.ddbCharacter.getCharacterData(getOptions);
      logger.debug("import.js getCharacterData result", this.ddbCharacter);
      if (game.settings.get("ddb-importer", "debug-json")) {
        FileHelper.download(JSON.stringify(this.ddbCharacter.source), `${derivedCharacterId}.json`, "application/json");
      }
      if (this.ddbCharacter.source?.success) {
        // begin parsing the character data
        await this.ddbCharacter.process();
        await this.processCharacterData();
        this.notifier("Loading Character data", { message: "Done." });
        logger.debug("Character Load complete", { ddbCharacter: this.ddbCharacter, result: this.result, actor: this.actor, actorOriginal: this.actorOriginal });
      } else {
        this.notifier(this.ddbCharacter.source.message, { message: null, isError: true });
        return false;
      }
    } catch (error) {
      switch (error.message) {
        case "ImportFailure":
          logger.error("Failure", { ddbCharacter: this.ddbCharacter, result: this.result });
          break;
        case "Forbidden":
          this.notifier("Error retrieving Character: " + error, { message: error, isError: true });
          break;
        default:
          logger.error(error);
          logger.error(error.stack);
          this.notifier("Error processing Character: " + error, { message: error, isError: true });
          logger.error("Failure", { ddbCharacter: this.ddbCharacter, result: this.result });
          break;
      }
      return false;
    } finally {
      delete CONFIG.DDBI.keyPostfix;
      delete CONFIG.DDBI.useLocal;
    }
    return true;
  }


  static async importCharacter({ actor, notifier } = {}) {
    try {
      const actorData = actor.toObject();
      const characterId = actorData.flags.ddbimporter.dndbeyond.characterId;

      const ddbCharacterOptions = {
        currentActor: actor,
        characterId,
        selectResources: true,
      };
      const getOptions = {
        syncId: null,
        localCobaltPostFix: actorData._id,
      };
      const ddbCharacter = new DDBCharacter(ddbCharacterOptions);
      await ddbCharacter.getCharacterData(getOptions);
      await ddbCharacter.process();

      logger.debug("import.js importCharacter getCharacterData result", ddbCharacter.source);
      if (game.settings.get("ddb-importer", "debug-json")) {
        FileHelper.download(JSON.stringify(ddbCharacter.source), `${characterId}.json`, "application/json");
      }
      if (ddbCharacter.source.success) {
        // begin parsing the character data

        const importer = new DDBCharacterImporter({
          actorId: actorData._id,
          ddbCharacter,
          notifier,
        });

        await importer.processCharacterData();
        importer.notifier("Loading Character data", { message: "Done." });
        logger.info("Loading Character data");
        return true;
      } else {
        logger.error("Error Loading Character data", { message: ddbCharacter.source.message, ddbCharacter });
        return false;
      }
    } catch (error) {
      switch (error.message) {
        case "ImportFailure":
          logger.error("Failure");
          break;
        case "Forbidden":
          logger.error("Error retrieving Character: ", error);
          break;
        default:
          logger.error("Error processing Character: ", error);
          logger.error(error.stack);
          break;
      }
      return false;
    }
  }

  static async importCharacterById(characterId, notifier) {
    const actor = await Actor.create({
      name: "New Actor",
      type: "character",
      flags: {
        ddbimporter: {
          dndbeyond: {
            characterId: characterId,
            url: `https://www.dndbeyond.com/characters/${characterId}`,
          },
        },
      },
    });

    const result = await DDBCharacterImporter.importCharacter(actor, notifier);
    return result;
  }

}
