/* eslint-disable no-await-in-loop */
/* eslint-disable no-continue */
/* eslint-disable require-atomic-updates */
// import DICTIONARY from "../dictionary.js";
// import SETTINGS from "../settings.js";

import DICTIONARY from "../../dictionary.js";
import CompendiumHelper from "../../lib/CompendiumHelper.js";
import FolderHelper from "../../lib/FolderHelper.js";
import utils from "../../lib/utils.js";
import logger from "../../logger.js";

export default class ChrisPremadesHelper {

  static DDB_FLAGS_TO_REMOVE = [
    "midi-qol",
    "midiProperties",
    "ActiveAuras",
    "dae",
    "itemacro",
  ];

  static CP_FLAGS_TO_REMOVE = [
    "cf",
    "ddbimporter",
    "monsterMunch",
    "core",
    "link-item-resource-5e",
  ];

  static CP_FIELDS_TO_COPY = [
    "effects",
    "system.damage",
    "system.target",
    "system.range",
    "system.duration",
    "system.save",
    "system.activation",
    "system.ability",
    "system.critical",
    "system.formula",
    "system.actionType",
  ];

  static CP_COMPENDIUM_TYPES = [
    { type: "spell", system: "spell" },
    { type: "feat", system: "feature" },
    { type: "feat", system: "trait" },
    { type: "feat", system: "feat" },
    { type: "equipment", system: "inventory" },
    { type: "weapon", system: "weapon" },
    { type: "consumable", system: "consumable" },
    { type: "tool", system: "tool" },
    { type: "loot", system: "loot" },
    // { type: "container", system: "container" },
    { type: "equipment", system: "container" },
    { type: "equipment", system: "backback" },
    { type: "equipment", system: "equipment" },
  ];

  static async getChrisCompendiumIndex(compendiumName, matchedProperties = {}) {
    const gamePack = CompendiumHelper.getCompendium(compendiumName);
    const index = await gamePack.getIndex({
      fields: ["name", "type", "flags.cf", "folder"].concat(Object.keys(matchedProperties))
    });
    return index;
  }

  static async getChrisCompendiums(type, isMonster = false, matchedProperties = {}) {
    if (chrisPremades.helpers.getSearchCompendiums) {
      const baseType = ChrisPremadesHelper.CP_COMPENDIUM_TYPES.find((t) => t.system === type)?.type ?? type;
      const compendiums = (
        isMonster
          ? (chrisPremades.helpers.getMonsterFeatureSearchCompendiums
            ? chrisPremades.helpers.getMonsterFeatureSearchCompendiums()
            : ['chris-premades.CPR Monster Features'])
          : []
      ).concat(await chrisPremades.helpers.getSearchCompendiums(baseType));
      const results = (await Promise.all(compendiums
        .filter((c) => game.packs.get(c))
        .map(async (c) => {
          const index = await ChrisPremadesHelper.getChrisCompendiumIndex(c, matchedProperties);
          // console.warn(`Matched`, {
          //   type, baseType, compendiums, index, c
          // });
          const result = {
            index: index.filter((i) => i.type === baseType),
            packName: c,
            compendium: game.packs.get(c),
          };
          return result;
        }))).filter((r) => r.index.length > 0);
      // console.warn("Results", results);
      return results;
    } else {
      return [];
    }
  }

  static getOriginalName(document) {
    const flagName = document.flags.ddbimporter?.originalName ?? document.name;

    const regex = /(.*)\s*\((:?costs \d actions|\d\/Turn|Recharges after a Short or Long Rest|\d\/day|recharge \d-\d)\)/i;
    const nameMatch = flagName.replace(/[–-–−]/g, "-").match(regex);
    if (nameMatch) {
      return nameMatch[1].trim();
    } else {
      return flagName;
    }
  }

  static getTypeMatch(doc, isMonster = false) {
    if (DICTIONARY.types.inventory.includes(doc.type)) {
      return "inventory";
    }
    if (doc.type !== "feat") return doc.type;

    // feats cover a variety of sins, lets try and narrow it down
    if (isMonster) return "monsterfeature";

    // lets see if we have marked this as a class or race type
    const systemTypeValue = foundry.utils.getProperty(doc, "system.type.value");
    if (systemTypeValue && systemTypeValue !== "") {
      if (systemTypeValue === "class") return "feature";
      if (systemTypeValue === "race") return "trait";
      return systemTypeValue;
    }

    // can we derive the type from the ddb importer type flag?
    const ddbType = foundry.utils.getProperty(doc, "flags.ddbimporter.type");
    if (ddbType && !["", "other"].includes(ddbType)) {
      if (ddbType === "class") return "feature";
      if (ddbType === "race") return "trait";
      return ddbType;
    }

    if (doc.type === "feat") {
      return "feature";
    }

    return doc.type;
  }

  // matchedProperties = { "system.activation.type": "bonus" }
  static async getDocumentFromCompendium(key, name, ignoreNotFound, folderId, matchedProperties = {}) {
    const gamePack = game.packs.get(key);
    if (!gamePack) {
      ui.notifications.warn('Invalid compendium specified!');
      return false;
    }

    const packIndex = await gamePack.getIndex({
      fields: ['name', 'type', 'folder'].concat(Object.keys(matchedProperties))
    });

    const match = packIndex.find((item) =>
      item.name === name
      && (!folderId || (folderId && item.folder === folderId))
      && (Object.keys(matchedProperties).length === 0 || utils.matchProperties(item, matchedProperties))
    );

    if (match) {
      return (await gamePack.getDocument(match._id))?.toObject();
    } else {
      if (!ignoreNotFound) {
        ui.notifications.warn(`Item not found in compendium ${key} with name ${name}! Check spelling?`);
        logger.warn(`Item not found in compendium ${key} with name ${name}! Check spelling?`, { key, name, folderId, matchedProperties });
      }
      return undefined;
    }
  }

  static async getDocumentFromName(documentName, type,
    { folderName = null, isMonster = false, matchedProperties = {} } = {}
  ) {

    const compendiums = await ChrisPremadesHelper.getChrisCompendiums(type, isMonster);
    if (compendiums.length === 0) {
      logger.warn(`No compendium found for Chris's Premade effect for ${type} and ${documentName}, with type ${type}!`);
      return undefined;
    }

    // console.warn("here", { this: this });

    // const allowFolders = ["weapon", "feat"].includes(this.original.type);

    for (const c of compendiums) {
      const folderId = isMonster // && allowFolders
        ? await FolderHelper.getCompendiumFolderId((folderName ?? documentName), c.packName)
        : undefined;

      // expected to find feature in a folder, but we could not
      // if (allowFolders && folderName && folderId === undefined) {
      if (folderName && folderId === undefined) {
        logger.debug(`No folder found for ${folderName} and ${documentName}, checking compendium name ${c.packName}`);
        continue;
      }

      logger.debug(`CP Effect: Attempting to fetch ${documentName} from ${c.packName} with folderID ${folderId}`);
      // const chrisDoc = await ChrisPremadesHelper.getDocumentFromCompendium(c.packName, documentName, true, folderId, matchedProperties);
      const match = c.index.find((doc) =>
        doc.name === documentName
        && (!folderId || (folderId && doc.folder === folderId))
        && (Object.keys(matchedProperties).length === 0 || utils.matchProperties(doc, matchedProperties))
      );

      const chrisDoc = match
        ? (await c.compendium.getDocument(match._id))?.toObject()
        : undefined;
      if (!chrisDoc) continue;
      return chrisDoc;
    }

    logger.debug(`No CP Effect found for ${documentName} from all matched compendiums with folderName ${folderName}`);
    return undefined;
  }


  constructor(document,
    { chrisNameOverride = null, isMonster = false, folderName = null, ignoreNotFound = true, type = null,
      matchedProperties = {} } = {}
  ) {
    this.original = foundry.utils.deepClone(document);
    this.document = document;
    this.chrisNameOverride = chrisNameOverride;
    this.isMonster = isMonster;
    this.folderName = folderName;
    this.ignoreNotFound = ignoreNotFound;
    this.type = type ?? ChrisPremadesHelper.getTypeMatch(document, isMonster);
    this.matchProperties = matchedProperties;
    this.ddbName = ChrisPremadesHelper.getOriginalName(document);
    this.chrisName = chrisNameOverride ?? CONFIG.chrisPremades?.renamedItems[this.ddbName] ?? this.ddbName;
    this.chrisDoc = null;
  }

  async findReplacement() {
    const compendiums = await ChrisPremadesHelper.getChrisCompendiums(this.original.type, this.isMonster);
    logger.debug("Compendiums found", {
      compendiums,
      this: this,
      type: this.original.type,
      isMonster: this.isMonster,
    });
    if (compendiums.length === 0) {
      logger.warn(`No compendium found for Chris's Premade effect for "${this.original.name}" with original type ${this.original.type} and with type object type ${this.type}!`, {
        this: this,
      });
      return undefined;
    }

    const allowFolders = ["weapon", "feat"].includes(this.original.type) && this.isMonster;

    for (const c of compendiums) {
      const folderId = allowFolders
        ? await FolderHelper.getCompendiumFolderId((this.folderName ?? this.chrisName), c.packName)
        : undefined;

      // expected to find feature in a folder, but we could not
      if (allowFolders && folderId === undefined) {
        logger.debug(`Needed folder, but none found for ${this.folderName} and ${this.original.name}, using compendium name ${c.packName}`);
        continue;
      }

      logger.debug(`CP Effect: Attempting to fetch ${this.original.name} from ${c.packName} with folderID ${folderId}`);
      const chrisDoc = await ChrisPremadesHelper.getDocumentFromCompendium(c.packName, this.chrisName, this.ignoreNotFound, folderId, this.matchedProperties);
      if (!chrisDoc) continue;
      const chrisType = ChrisPremadesHelper.getTypeMatch(chrisDoc, this.isMonster);
      if (this.type === chrisType) {
        this.chrisDoc = chrisDoc;
        return chrisDoc;
      }
    }

    logger.debug(`No CP Effect found for ${this.original.name} from all matched compendiums with folderName ${this.folderName}`);
    return undefined;
  }

  updateOriginalDocument() {
    ChrisPremadesHelper.DDB_FLAGS_TO_REMOVE.forEach((flagName) => {
      delete this.document.flags[flagName];
    });

    this.document.effects = [];

    ChrisPremadesHelper.CP_FLAGS_TO_REMOVE.forEach((flagName) => {
      delete this.chrisDoc.flags[flagName];
    });

    this.document.flags = foundry.utils.mergeObject(this.document.flags, this.chrisDoc.flags);

    ChrisPremadesHelper.CP_FIELDS_TO_COPY.forEach((field) => {
      const values = foundry.utils.getProperty(this.chrisDoc, field);
      if (field === "effects") {
        values.forEach((effect) => {
          effect._id = foundry.utils.randomID();
        });
      }
      foundry.utils.setProperty(this.document, field, values);
    });

    foundry.utils.setProperty(this.document, "flags.ddbimporter.effectsApplied", true);
    foundry.utils.setProperty(this.document, "flags.ddbimporter.chrisEffectsApplied", true);
    foundry.utils.setProperty(this.document, "flags.ddbimporter.chrisPreEffectName", this.ddbName);

    const correctionProperties = foundry.utils.getProperty(CONFIG, `chrisPremades.correctedItems.${this.chrisName}`);
    if (correctionProperties) {
      logger.debug(`Updating ${this.original.name} with a Chris correction properties`);
      this.document = foundry.utils.mergeObject(this.document, correctionProperties);
    }

    logger.debug(`Updated ${this.original.name} with a Chris effect`);
    delete this.document.folder;

  }

  static async find({ document, type, isMonster = false, folderName = null, chrisNameOverride = null } = {}) {
    if (!game.modules.get("chris-premades")?.active) return document;
    if (foundry.utils.getProperty(document, "flags.ddbimporter.ignoreItemForChrisPremades") === true) {
      logger.info(`${document.name} set to ignore Chris's Premade effect application`);
      return document;
    }

    const chrisHelper = new ChrisPremadesHelper(document, { type, chrisNameOverride, folderName, ignoreNotFound: true, isMonster });
    const chrisDoc = await chrisHelper.findReplacement();
    if (!chrisDoc) {
      return document;
    }

    return chrisDoc.document;
  }

  static async findAndUpdate({ document, type, isMonster = false, folderName = null, chrisNameOverride = null } = {}) {
    if (!game.modules.get("chris-premades")?.active) return document;
    if (foundry.utils.getProperty(document, "flags.ddbimporter.ignoreItemForChrisPremades") === true) {
      logger.info(`${document.name} set to ignore Chris's Premade effect application`);
      return document;
    }

    const chrisHelper = new ChrisPremadesHelper(document, { type, chrisNameOverride, folderName, ignoreNotFound: true, isMonster });
    const chrisDoc = await chrisHelper.findReplacement();
    if (!chrisDoc) {
      return document;
    }

    chrisHelper.updateOriginalDocument();

    return chrisHelper.document;
  }

  // eslint-disable-next-line no-unused-vars
  static async addAndReplaceRedundantChrisDocuments(actor, _folderName = null) {
    if (!game.modules.get("chris-premades")?.active) return;
    logger.debug("Beginning additions and removals of extra effects.");
    const documents = actor.getEmbeddedCollection("Item").toObject();
    const toAdd = [];
    const toDelete = [];

    for (let doc of documents) {
      if (["class", "subclass", "background"].includes(doc.type)) continue;

      const ddbName = ChrisPremadesHelper.getOriginalName(doc);
      const chrisName = CONFIG.chrisPremades?.renamedItems[ddbName] ?? ddbName;
      const newItemNames = foundry.utils.getProperty(CONFIG, `chrisPremades.additionalItems.${chrisName}`);

      if (newItemNames) {
        logger.debug(`Adding new items for ${chrisName}`);

        for (const newItemName of newItemNames) {
          logger.debug(`Adding new item ${newItemName}`);
          const chrisDoc = await ChrisPremadesHelper.getDocumentFromName(newItemName, doc.type);
          if (!chrisDoc) {
            logger.error(`DDB Importer expected to find an item in Chris's Premades for ${newItemName} but did not`, {
              ddbName,
              doc,
              chrisName,
              newItemNames,
              documents,
              chrisDoc,
            });
          } else if (!documents.some((d) => d.name === chrisDoc.name)) {
            foundry.utils.setProperty(chrisDoc, "flags.ddbimporter.ignoreItemUpdate", true);
            toAdd.push(chrisDoc);
          }
        }
      }

      const itemsToRemoveNames = foundry.utils.getProperty(CONFIG, `chrisPremades.removedItems.${chrisName}`);
      if (itemsToRemoveNames) {
        logger.debug(`Removing items for ${chrisName}`);
        for (const removeItemName of itemsToRemoveNames) {
          logger.debug(`Removing item ${removeItemName}`);
          const deleteDoc = documents.find((d) => ChrisPremadesHelper.getOriginalName(d) === removeItemName);
          if (deleteDoc) toDelete.push(deleteDoc._id);
        }
      }
    }

    logger.debug("Final Chris's Premades list", {
      toDelete,
      toAdd,
    });
    await actor.deleteEmbeddedDocuments("Item", toDelete);
    await actor.createEmbeddedDocuments("Item", toAdd);

  }


  // eslint-disable-next-line complexity
  static async restrictedItemReplacer(actor, folderName = null) {
    if (!game.modules.get("chris-premades")?.active) return;
    logger.debug("Beginning additions and removals of restricted effects.");

    const documents = actor.getEmbeddedCollection("Item").toObject();
    const restrictedItems = foundry.utils.getProperty(CONFIG, `chrisPremades.restrictedItems`);

    const sortedItems = Object.keys(restrictedItems).map((key) => {
      const data = restrictedItems[key];
      data["key"] = key;
      return data;
    }).sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));
    const toAdd = [];
    const toDelete = [];

    for (const restrictedItem of sortedItems) {
      logger.debug(`Checking restricted Item ${restrictedItem.key}: ${restrictedItem.originalName}`);
      const doc = documents.find((d) => {
        const ddbName = d.flags.ddbimporter?.chrisPreEffectName ?? ChrisPremadesHelper.getOriginalName(d);
        const retainDoc = foundry.utils.getProperty(document, "flags.ddbimporter.ignoreItemForChrisPremades") === true;
        return ddbName === restrictedItem.originalName && !retainDoc;
      });
      if (!doc) continue;
      if (["class", "subclass", "background"].includes(doc.type)) continue;
      const ddbName = doc.flags.ddbimporter?.chrisPreEffectName ?? ChrisPremadesHelper.getOriginalName(doc);

      const rollData = actor.getRollData();

      if (restrictedItem.requiredClass && !rollData.classes[restrictedItem.requiredClass.toLowerCase()]) continue;
      if (restrictedItem.requiredSubclass) {
        const subClassData = rollData.classes[restrictedItem.requiredClass.toLowerCase()].subclass;
        if (!subClassData) continue;
        if (subClassData.parent.name.toLowerCase() !== restrictedItem.requiredSubclass.toLowerCase()) continue;
      }
      if (restrictedItem.requiredRace
        && restrictedItem.requiredRace.toLocaleLowerCase() !== (rollData.details.race?.name ?? rollData.details?.race)?.toLocaleLowerCase()
      ) continue;


      if (restrictedItem.requiredEquipment) {
        for (const requiredEquipment of restrictedItem.requiredEquipment) {
          const itemMatch = documents.some((d) => ddbName === requiredEquipment && DICTIONARY.types.inventory.includes(d.type));
          if (!itemMatch) continue;
        }
      }

      if (restrictedItem.requiredFeature) {
        for (const requiredFeature of restrictedItem.requiredFeature) {
          const itemMatch = documents.some((d) => ddbName === requiredFeature && d.type === "feat");
          if (!itemMatch) continue;
        }
      }

      if (restrictedItem.requiredFeatures) {
        for (const requiredFeature of restrictedItem.requiredFeatures) {
          const itemMatch = documents.some((d) => ddbName === requiredFeature && d.type === "feat");
          if (!itemMatch) continue;
        }
      }

      // now replace the matched item with the replaced Item
      if (restrictedItem.replacedItemName && restrictedItem.replacedItemName !== "") {
        logger.debug(`Replacing item data for ${ddbName}, using restricted data from ${restrictedItem.key}`);
        const updateDocument = await ChrisPremadesHelper.findAndUpdate({
          document: foundry.utils.duplicate(doc),
          folderName,
          chrisNameOverride: restrictedItem.replacedItemName,
        });
        if (updateDocument) {
          await actor.deleteEmbeddedDocuments("Item", [doc._id]);
          await actor.createEmbeddedDocuments("Item", [updateDocument], { keepId: true });
        }
      }


      if (restrictedItem.additionalItems && restrictedItem.additionalItems.length > 0) {
        logger.debug(`Adding new items for ${ddbName}, using restricted data from ${restrictedItem.key}`);

        const docAdd = documents.find((d) => d.name === ddbName);
        if (docAdd) {
          for (const newItemName of restrictedItem.additionalItems) {
            logger.debug(`Adding new item ${newItemName}`);
            const chrisDoc = await ChrisPremadesHelper.getDocumentFromName(newItemName, docAdd.type);

            // eslint-disable-next-line max-depth
            if (!chrisDoc) {
              logger.error(`DDB Importer expected to find an item in Chris's Premades for ${newItemName} but did not`, {
                ddbName,
                doc: docAdd,
                additionalItems: restrictedItem.additionalItems,
                documents,
                chrisDoc,
              });
            } else if (!documents.some((d) => d.name === chrisDoc.name)) {
              foundry.utils.setProperty(chrisDoc, "flags.ddbimporter.ignoreItemUpdate", true);
              toAdd.push(chrisDoc);
            }
          }
        }
      }

      if (restrictedItem.removedItems && restrictedItem.removedItems.length > 0) {
        logger.debug(`Removing items for ${ddbName}, using restricted data from ${restrictedItem.key}`);
        for (const removeItemName of restrictedItem.removedItems) {
          logger.debug(`Removing item ${removeItemName}`);
          const deleteDoc = documents.find((d) => ChrisPremadesHelper.getOriginalName(d) === removeItemName);
          if (deleteDoc) toDelete.push(deleteDoc._id);
        }
      }

    }

    logger.debug("Adding and removing the following restricted Chris's Premades", {
      toDelete,
      toAdd,
    });
    await actor.deleteEmbeddedDocuments("Item", toDelete);
    await actor.createEmbeddedDocuments("Item", toAdd);

  }

}
