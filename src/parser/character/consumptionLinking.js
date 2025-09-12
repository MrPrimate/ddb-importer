import { DICTIONARY } from "../../config/_module.mjs";
import { logger } from "../../lib/_module.mjs";
import DDBCharacter from "../DDBCharacter.js";

const notReplace = {
  "Starry Form": ["Starry Form: Archer", "Starry Form: Chalice", "Starry Form: Dragon"],
};


DDBCharacter.prototype._getAutoLinkActivityDictionarySpellLinkUpdates = async function _getAutoLinkActivityDictionarySpellLinkUpdates() {
  const possibleItems = this.currentActor.items.toObject();
  let toUpdate = [];

  for (const [featureName, linkedSpellArray] of Object.entries(DICTIONARY.CONSUMPTION_SPELL_LINKS)) {
    logger.debug(`Resource Spells: Checking ${featureName}`, linkedSpellArray);
    const parent = possibleItems.find((doc) => {
      const name = doc.flags.ddbimporter?.originalName ?? doc.name;
      return name === featureName;
    });
    if (!parent) continue;
    logger.debug(`Resource Spells: ${featureName} parent:`, parent);
    for (const spellData of linkedSpellArray) {
      logger.debug(`Checking ${spellData.name}`, spellData);
      const child = possibleItems.find((doc) => {
        const name = doc.flags.ddbimporter?.originalName ?? doc.name;
        const lookupName = doc.flags.ddbimporter?.dndbeyond?.lookupName ?? "NO_LOOKUP_NAME";
        return name === spellData.name && spellData.lookupName === lookupName;
      });

      if (!child) continue;

      if (foundry.utils.getProperty(child, "flags.ddbimporter.retainResourceConsumption"))
        continue;

      logger.debug(`Resource Spells: ${featureName} child:`, child);
      const update = {
        _id: child._id,
        system: {},
      };

      if (!foundry.utils.getProperty(child, "flags.ddbimporter.retainChildUses")) {
        update.system["uses"] = {
          spent: null,
          max: "",
        };
      }
      if (spellData.nameUpdate) {
        update.name = spellData.nameUpdate;
      }
      if (spellData.cost !== 0) {
        const ignoredConsumptionActivities = foundry.utils.getProperty(child, "flags.ddbimporter.ignoredConsumptionActivities");
        for (const id of Object.keys(child.system.activities)) {
          // eslint-disable-next-line max-depth
          if (ignoredConsumptionActivities?.includes(child.system.activities[id].name)) continue;
          const targets = child.system.activities[id].consumption.targets;
          const cost = foundry.utils.getProperty(child, "flags.ddbimporter.consumptionValue") ?? spellData.cost;
          // eslint-disable-next-line max-depth
          if (foundry.utils.getProperty(child, "flags.ddbimporter.retainOriginalConsumption")) {
            targets.push(
              {
                target: parent._id,
                value: `${cost}`,
                type: "itemUses",
              },
            );
            foundry.utils.setProperty(update, `system.activities.${id}.consumption.targets`, targets);
          } else {
            foundry.utils.setProperty(update, `system.activities.${id}.consumption.targets`, [{
              target: parent._id,
              value: `${cost}`,
              type: "itemUses",
            }]);
          }
          const spellSlot = foundry.utils.getProperty(child, "flags.ddbimporter.spellSlot") ?? false;
          foundry.utils.setProperty(update, `system.activities.${id}.consumption.spellSlot`, spellSlot);
        }
      }
      if (spellData.forceInnate) {
        foundry.utils.setProperty(update, "system.method", "innate");
        foundry.utils.setProperty(update, "system.prepared", CONFIG.DND5E.spellPreparationStates.always.value);
      }
      toUpdate.push(update);
    }
  }

  return toUpdate;
};


function _generateChildUpdate({ child, parent } = {}) {
  const update = {
    _id: child._id,
    system: {},
  };
  if (!foundry.utils.getProperty(child, "flags.ddbimporter.retainChildUses")) {
    update.system["uses"] = {
      spent: null,
      max: "",
    };
  }
  const ignoredConsumptionActivities = foundry.utils.getProperty(child, "flags.ddbimporter.ignoredConsumptionActivities");
  for (const id of Object.keys(child.system.activities)) {
    if (ignoredConsumptionActivities?.includes(child.system.activities[id].name)) continue;
    const targets = child.system.activities[id].consumption.targets;
    const value = foundry.utils.getProperty(child, "flags.ddbimporter.consumptionValue") ?? 1;
    if (foundry.utils.getProperty(child, "flags.ddbimporter.retainOriginalConsumption")) {
      targets.push({
        type: "itemUses",
        value,
        target: `${parent._id}`,
      });
      foundry.utils.setProperty(update, `system.activities.${id}.consumption.targets`, targets);
    } else if (targets.length > 0) {
      targets[0].target = parent._id;
      foundry.utils.setProperty(update, `system.activities.${id}.consumption.targets`, targets);
    } else {
      foundry.utils.setProperty(update, `system.activities.${id}.consumption`, {
        spellSlot: false,
        targets: [{
          type: "itemUses",
          value,
          target: `${parent._id}`,
        }],
      });
    }
  }
  return update;
}


function _findChildUpdates({ consumingDocs, possibleItems, parent } = {}) {
  const toUpdate = [];
  logger.debug("parent", parent);
  consumingDocs.forEach((consumingDocName) => {
    logger.debug(`Checking ${consumingDocName}`);
    const children = possibleItems.filter((doc) => {
      const name = doc.flags.ddbimporter?.originalName ?? doc.name;
      const dontReplace = notReplace[consumingDocName]?.includes(name);
      if (dontReplace) return false;
      if (name.startsWith(consumingDocName)) return true;

      const additional = foundry.utils.getProperty(doc, "flags.ddbimporter.defaultAdditionalActivities");
      if (!additional?.enabled) return false;
      if (!additional.data.featureName) return false;
      return additional.data.featureName.startsWith(consumingDocName);
    });

    if (children) {
      logger.debug(`Found children`, children);
      for (const child of children) {
        if (foundry.utils.getProperty(child, "flags.ddbimporter.retainResourceConsumption"))
          continue;
        logger.debug("child", child);
        const update = _generateChildUpdate({ child, parent });
        toUpdate.push(update);
      }
    }
  });

  return toUpdate;

}


DDBCharacter.prototype._getAutoLinkActivityDictionaryUpdates = async function _getAutoLinkActivityDictionaryUpdates() {
  const possibleItems = this.currentActor.items.toObject();
  let toUpdate = [];

  for (const [resourceDocName, consumingDocs] of Object.entries(DICTIONARY.CONSUMPTION_LINKS)) {
    logger.debug(`Generic Resource Linking: Checking ${resourceDocName}`, consumingDocs);
    const parent = possibleItems.find((doc) => {
      const name = doc.flags.ddbimporter?.originalName ?? doc.name;
      return name === resourceDocName;
    });

    if (!parent) continue;
    logger.debug("parent", parent);
    _findChildUpdates({ consumingDocs, possibleItems, parent }).forEach((update) => {
      toUpdate.push(update);
    });
  }
  return toUpdate;
};

DDBCharacter.prototype._getAutoLinkActivityFlagDocUpdates = async function _getAutoLinkActivityFlagDocUpdates() {
  const possibleItems = this.currentActor.items.toObject();
  let toUpdate = [];

  const activityFlagDocs = possibleItems.filter((doc) =>
    foundry.utils.hasProperty(doc, "flags.ddbimporter.replaceActivityUses"),
  );
  for (const childDoc of activityFlagDocs) {
    if (foundry.utils.getProperty(childDoc, "flags.ddbimporter.retainResourceConsumption")) continue;
    logger.debug("updateDoc", childDoc);
    const update = {
      _id: childDoc._id,
      system: {},
    };

    const ignoredConsumptionActivities = foundry.utils.getProperty(childDoc, "flags.ddbimporter.ignoredConsumptionActivities");
    for (const id of Object.keys(childDoc.system.activities)) {
      if (ignoredConsumptionActivities?.includes(childDoc.system.activities[id].name)) continue;
      const targets = childDoc.system.activities[id].consumption.targets;

      for (const target of targets) {
        if (target.type !== "itemUses") continue;
        const parent = possibleItems.find((doc) => {
          const name = doc.flags.ddbimporter?.originalName ?? doc.name;
          return name === target.target;
        });
        if (parent) {
          target.target = parent._id;
        } else {
          target.target = "";
        }
      }
      foundry.utils.setProperty(update, `system.activities.${id}.consumption.targets`, targets);
    }

    toUpdate.push(update);
  }

  return toUpdate;
};

DDBCharacter.prototype._flagCleanup = async function _flagCleanup() {
  const possibleItems = this.currentActor.items.toObject();
  const toUpdate = possibleItems
    .filter((doc) => foundry.utils.hasProperty(doc, "flags.ddbimporter.defaultAdditionalActivities"))
    .map((doc) => {
      return {
        _id: doc._id,
        flags: {
          ddbimporter: {
            "-=defaultAdditionalActivities": null,
          },
        },
      };
    });

  await this.currentActor.updateEmbeddedDocuments("Item", toUpdate);
  logger.debug("Flag cleanup updates", toUpdate);
};

DDBCharacter.prototype.autoLinkConsumption = async function autoLinkConsumption() {
  let toUpdate = [];

  const activityFlagUpdates = await this._getAutoLinkActivityFlagDocUpdates();
  toUpdate.push(...activityFlagUpdates);

  const activityDictionaryUpdates = await this._getAutoLinkActivityDictionaryUpdates();
  toUpdate.push(...activityDictionaryUpdates);

  const spellUpdates = await this._getAutoLinkActivityDictionarySpellLinkUpdates();
  toUpdate.push(...spellUpdates);

  logger.debug("toUpdate", toUpdate);

  const results = await this.currentActor.updateEmbeddedDocuments("Item", toUpdate);
  logger.debug("resource Update results", results);

  await this._flagCleanup();

};
