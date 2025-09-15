/* eslint-disable no-continue */
/* eslint-disable require-atomic-updates */

import { DICTIONARY } from "../../config/_module.mjs";
import {
  logger,
} from "../../lib/_module.mjs";


export default class ChrisPremadesHelper {

  static DDB_FLAGS_TO_REMOVE = [
    "midi-qol",
    "midiProperties",
    "ActiveAuras",
    "auraeffects",
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
    "system.ammunition",
    "system.mastery",
    "system.scaling",
    "system.activities",
    "system.properties",
    "system.enchant",
    "flags.chris-premades",
  ];

  static getOriginalName(document, trimOption = false) {
    const flagName = document.flags.ddbimporter?.originalName ?? document.name;

    const regex = /(.*)\s*\((:?costs \d actions|\d\/Turn|Recharges after a Short or Long Rest|\d\/day|recharge \d-\d)\)/i;
    const nameMatch = flagName.replace(/[–-–−]/g, "-").match(regex);
    const longName = nameMatch ? nameMatch[1].trim() : flagName;
    if (!trimOption) return longName;

    return longName.split(":")[0].trim();

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


  static async getDocumentFromName({
    documentName, documentType,
    rules = '2014', monsterName = null, actorType = 'character', featType = null,
  } = {},
  ) {

    const itemData = await chrisPremades.integration.ddbi(documentName, {
      rules,
      actorType,
      itemType: documentType, // "spell",
      monsterName,
      featType,
    });
    if (itemData) return itemData;

    logger.debug(`No CP Effect found for ${documentName} from Chris API`, {
      documentName,
      documentType,
      rules,
      actorType,
      monsterName,
      featType,
    });
    return undefined;
  }


  constructor(document,
    { chrisNameOverride = null, monsterName = null, ignoreNotFound = true, type = null,
      rules = null, documentType = null, featType = null } = {},
  ) {
    this.original = foundry.utils.deepClone(document);
    this.document = document;
    this.chrisNameOverride = chrisNameOverride;
    this.isMonster = monsterName !== null;
    this.monsterName = monsterName;
    this.ignoreNotFound = ignoreNotFound;
    this.type = type ?? ChrisPremadesHelper.getTypeMatch(document, this.isMonster);
    this.ddbName = ChrisPremadesHelper.getOriginalName(document);
    this.chrisName = chrisNameOverride ?? CONFIG.chrisPremades?.renamedItems[this.ddbName] ?? this.ddbName;
    this.chrisDoc = null;
    this.rules = rules ?? document.system.source.rules ?? "2014";
    this.featType = featType ?? document.system.type?.value;
    this.documentType = documentType ?? this.document.type;
  }

  async getDocumentFromChrisAPI() {
    const options = {
      rules: this.rules,
      actorType: this.isMonster ? 'npc' : 'character',
      itemType: this.documentType, // "spell",
      monsterName: this.isMonster ? this.monsterName : null,
      featType: this.featType, // 'race',
    };
    logger.debug("getDocumentFromChrisAPI", {
      chrisName: this.chrisName,
      options,
    });
    const itemData = await chrisPremades.integration.ddbi(this.chrisName, options);
    return itemData;
  }

  async findReplacement() {
    const chrisDoc = await this.getDocumentFromChrisAPI();
    if (!chrisDoc) return undefined;
    const chrisType = ChrisPremadesHelper.getTypeMatch(chrisDoc, this.isMonster);

    logger.debug("Found", {
      thisType: this.type,
      chrisType,
      chrisDoc,
      truthy: this.type === chrisType,
    });
    if (this.type === chrisType) {
      if (!chrisDoc.flags["chris-premades"].info.rules) {
        chrisDoc.flags["chris-premades"].info.rules = this.original.system.source.rules === "2014" ? "legacy" : "";
      }
      this.chrisDoc = chrisDoc;
      return chrisDoc;
    } else {
      logger.error(`Expected type ${this.type} but got ${chrisType} from Chris's Premades API. Original item: ${this.original.name}`, {
        this: this,
        chrisDoc,
        chrisType,
      });
    }

    logger.debug(`No CP Effect found for ${this.original.name} from CPR API`);
    return undefined;

  }

  static copyDescription(source, target, { appendSourceDescription = false, prependSourceDescription = false } = {}) {
    const sourceDescription = foundry.utils.getProperty(source, "system.description");
    if (!sourceDescription || sourceDescription.value.trim() === "") return target;

    if (appendSourceDescription) {
      ChrisPremadesHelper.appendDescription(source, target);
    } else if (prependSourceDescription) {
      const mockSource = foundry.utils.deepClone(target);
      const mockDescription = foundry.utils.getProperty(source, "flags.ddbimporter.initialFeature")
        ?? foundry.utils.getProperty(source, "system.description");

      mockSource.system.description = foundry.utils.deepClone(foundry.utils.getProperty(target, "system.description"));
      target.system.description = foundry.utils.deepClone(mockDescription);
      ChrisPremadesHelper.appendDescription(mockSource, target);
    } else {
      target.system.description = foundry.utils.deepClone(sourceDescription);
    }

    return target;
  }

  removeDDBImplementationNotes() {
    const description = foundry.utils.getProperty(this.document, "system.description.value");
    if (!description || description.trim() === "") return;
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = description;
    const notes = tempDiv.querySelectorAll('section.ddbSecret');
    notes.forEach((note) => note.remove());
    this.document.system.description.value = tempDiv.innerHTML;
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
          if (!effect._id) effect._id = foundry.utils.randomID();
        });
      }
      foundry.utils.setProperty(this.document, field, values);
    });

    foundry.utils.setProperty(this.document, "flags.ddbimporter.effectsApplied", true);
    foundry.utils.setProperty(this.document, "flags.ddbimporter.chrisEffectsApplied", true);
    foundry.utils.setProperty(this.document, "flags.ddbimporter.chrisPreEffectName", this.ddbName);

    const correctionProperties = foundry.utils.getProperty(CONFIG, `chrisPremades.correctedItems.${this.chrisName}`);
    if (correctionProperties) {
      logger.debug(`Updating ${this.original.name} with a CPR correction properties`);
      this.document = foundry.utils.mergeObject(this.document, correctionProperties);
    }

    this.removeDDBImplementationNotes();

    logger.debug(`Updated ${this.original.name} with a CPR effect`);
    delete this.document.folder;

  }

  static async findAndUpdate({ document, type, monsterName = null, chrisNameOverride = null } = {}) {
    if (!game.modules.get("chris-premades")?.active) return document;
    if (foundry.utils.getProperty(document, "flags.ddbimporter.ignoreItemForChrisPremades") === true) {
      logger.info(`${document.name} set to ignore Cauldron of Plentiful Resources effect application`);
      return document;
    }

    const chrisHelper = new ChrisPremadesHelper(document, {
      type,
      chrisNameOverride,
      ignoreNotFound: true,
      monsterName,
      rules: document.system.source.rules,
    });
    const chrisDoc = await chrisHelper.findReplacement();

    logger.verbose(`Find and update result: ${document.name} => ${chrisDoc?.name ?? "NO MATCH"}`, {
      document,
      chrisDoc,
      type,
      chrisHelper,
      chrisNameOverride,
    });
    if (!chrisDoc) {
      return document;
    }

    chrisHelper.updateOriginalDocument();

    return chrisHelper.document;
  }

  // eslint-disable-next-line no-unused-vars
  static async addAndReplaceRedundantChrisDocuments(actor, monsterName = null) {
    if (!game.modules.get("chris-premades")?.active) return;
    logger.debug("Beginning additions and removals of extra effects.");
    const documents = actor.getEmbeddedCollection("Item").toObject();
    const toAdd = [];
    const toDelete = new Set();
    const choiceRemovals = foundry.utils.getProperty(CONFIG, "chrisPremades.removeChoices") ?? [];
    const choiceAdditions = new Set();

    for (let doc of documents) {
      if (["class", "subclass", "background"].includes(doc.type)) continue;

      const ddbName = ChrisPremadesHelper.getOriginalName(doc);
      const chrisName = CONFIG.chrisPremades?.renamedItems[ddbName] ?? ddbName;
      const noChoiceName = ddbName.split(":")[0].trim();
      const newItemNames = new Set(foundry.utils.getProperty(CONFIG, `chrisPremades.additionalItems.${chrisName}`) ?? []);

      if (ddbName !== noChoiceName) {
        const noChoiceNewNames = foundry.utils.getProperty(CONFIG, `chrisPremades.additionalItems.${noChoiceName}`);
        if (noChoiceNewNames && !choiceAdditions.has(noChoiceName)) {
          noChoiceNewNames.forEach((i) => newItemNames.add(i));
          choiceAdditions.add(noChoiceName);
        }
      }

      if (newItemNames.size > 0) {
        logger.debug(`Adding new items for ${chrisName}`);

        for (const newItemName of newItemNames) {
          logger.debug(`Adding new item ${newItemName}`);
          const chrisDoc = await ChrisPremadesHelper.getDocumentFromName({
            documentName: newItemName,
            documentType: doc.type,
            rules: doc.system.source.rules,
            actorType: monsterName !== null ? "npc" : "character",
            monsterName,
          });
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
            ChrisPremadesHelper.copyDescription(doc, chrisDoc, { prependSourceDescription: this.appendDescription });
            foundry.utils.setProperty(chrisDoc, "flags.ddbimporter.ignoreItemUpdate", true);
            toAdd.push(chrisDoc);
          }
        }
      }

      const itemsToRemoveNames = new Set(foundry.utils.getProperty(CONFIG, `chrisPremades.removedItems.${chrisName}`) ?? []);
      if (choiceRemovals.includes(noChoiceName)) {
        itemsToRemoveNames.add(ddbName);
      }
      if (itemsToRemoveNames.size > 0) {
        logger.debug(`Removing items for ${chrisName}`);
        for (const removeItemName of itemsToRemoveNames) {
          logger.debug(`Removing item ${removeItemName}`);
          const deleteDoc = documents.find((d) => ChrisPremadesHelper.getOriginalName(d) === removeItemName);
          if (deleteDoc) toDelete.add(deleteDoc._id);
        }
      }
    }

    logger.debug("Final Chris's Premades list", {
      toDelete,
      toAdd,
    });
    await actor.deleteEmbeddedDocuments("Item", Array.from(toDelete));
    await actor.createEmbeddedDocuments("Item", toAdd);

  }


  // eslint-disable-next-line complexity
  static async restrictedItemReplacer(actor, monsterName = null) {
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
    const toDelete = new Set();

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
        const itemMatch = restrictedItem.requiredEquipment
          .every((requiredEquipment) =>
            documents.some((d) =>
              (d.flags.ddbimporter?.chrisPreEffectName ?? ChrisPremadesHelper.getOriginalName(d)) === requiredEquipment
              && DICTIONARY.types.inventory.includes(d.type),
            ));
        if (!itemMatch) continue;
      }

      if (restrictedItem.requiredFeatures) {
        const itemMatch = restrictedItem.requiredFeatures
          .every((requiredFeature) =>
            documents.some((d) =>
              (d.flags.ddbimporter?.chrisPreEffectName ?? ChrisPremadesHelper.getOriginalName(d)) === requiredFeature
              && d.type === "feat",
            ));
        if (!itemMatch) continue;
      }

      // now replace the matched item with the replaced Item
      if (restrictedItem.replacedItemName && restrictedItem.replacedItemName !== "") {
        logger.debug(`Replacing item data for ${ddbName}, using restricted data from ${restrictedItem.key}`);
        const updateDocument = await ChrisPremadesHelper.findAndUpdate({
          document: foundry.utils.duplicate(doc),
          monsterName,
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
            const chrisDoc = await ChrisPremadesHelper.getDocumentFromName({
              documentName: newItemName,
              documentType: docAdd.type,
              rules: docAdd.system.source.rules,
              actorType: monsterName !== null ? "npc" : "character",
              monsterName,
            });

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
          if (deleteDoc) toDelete.add(deleteDoc._id);
        }
      }

    }

    logger.debug("Adding and removing the following restricted Cauldron of Plentiful Resources items", {
      toDelete,
      toAdd,
    });
    await actor.deleteEmbeddedDocuments("Item", Array.from(toDelete));
    await actor.createEmbeddedDocuments("Item", toAdd);

  }

}
