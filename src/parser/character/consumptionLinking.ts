import { DICTIONARY } from "../../config/_module";
import { logger, utils } from "../../lib/_module";
import DDBCharacter from "../DDBCharacter";

const notReplace = {
  "Starry Form": ["Starry Form: Archer", "Starry Form: Chalice", "Starry Form: Dragon"],
};

const IDENTIFIER_PATTERN = /^[a-z0-9][a-z0-9-]*$/;
const TYPED_IDENTIFIER_PATTERN = /^[^:\s]+:[a-z0-9][a-z0-9-]*$/;


/** Return the portable, type-qualified identifier used by dnd5e consumption targets. */
function _qualifiedConsumptionTarget(parent): string {
  return `${parent.type}:${parent.system.identifier}`;
}


/**
 * Find a resource item from any target form accepted by the importer.
 *
 * Explicit type-qualified identifiers are authoritative: if the requested type is not present,
 * do not silently fall through to an item of another type with the same identifier.
 */
function _findConsumptionParent(possibleItems, target: string) {
  const value = target.trim();

  const qualifiedMatch = possibleItems.find((doc) => _qualifiedConsumptionTarget(doc) === value);
  if (qualifiedMatch || TYPED_IDENTIFIER_PATTERN.test(value)) return qualifiedMatch;

  const identifierMatch = possibleItems.find((doc) => doc.system.identifier === value);
  if (identifierMatch) return identifierMatch;

  const nameMatch = possibleItems.find((doc) =>
    doc.flags.ddbimporter?.originalName === value || doc.name === value,
  );
  if (nameMatch) return nameMatch;

  const normalizedIdentifier = utils.referenceNameString(value).toLowerCase();
  return possibleItems.find((doc) => doc.system.identifier === normalizedIdentifier);
}


/**
 * The uses update applied to a child document when it is linked to a parent resource pool.
 *
 * Returns null when nothing should be written.
 */
function _childUsesUpdate(child): { spent: number | null; max: string } | null {
  if (foundry.utils.getProperty(child, "flags.ddbimporter.retainChildUses")) return null;
  const retainSpent = foundry.utils.getProperty(child, "flags.ddbimporter.retainUseSpent") ?? false;
  return {
    spent: retainSpent
      ? foundry.utils.getProperty(child, "system.uses.spent") as number ?? null
      : null,
    max: "",
  };
}


/** Preserve authored identifiers when no matching resource is currently present. */
function _unresolvedConsumptionTarget(target: string): string {
  const value = target.trim();
  if (IDENTIFIER_PATTERN.test(value) || TYPED_IDENTIFIER_PATTERN.test(value)) return value;
  return utils.referenceNameString(value).toLowerCase();
}


DDBCharacter.prototype._getAutoLinkActivityDictionarySpellLinkUpdates = async function _getAutoLinkActivityDictionarySpellLinkUpdates(this: DDBCharacter) {
  const possibleItems = this.currentActor.items.toObject();
  const toUpdate = [];

  for (const [featureName, linkedSpellArray] of Object.entries(DICTIONARY.CONSUMPTION_SPELL_LINKS)) {
    logger.debug(`Resource Spells: Checking ${featureName}`, linkedSpellArray);
    const parent = _findConsumptionParent(possibleItems, featureName);
    if (!parent) continue;
    logger.debug(`Resource Spells: ${featureName} parent:`, parent);
    const typedSpellArray = linkedSpellArray as {
      name: string;
      cost: number;
      lookupName: string;
      nameUpdate?: string;
      forceInnate?: boolean;
    }[];
    for (const spellData of typedSpellArray) {
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

      const usesUpdate = _childUsesUpdate(child);
      if (usesUpdate) {
        update.system["uses"] = usesUpdate;
      }
      if (spellData.nameUpdate) {
        update.name = spellData.nameUpdate;
      }
      if (spellData.cost !== 0) {
        const ignoredConsumptionActivities = foundry.utils.getProperty(child, "flags.ddbimporter.ignoredConsumptionActivities");
        for (const id of Object.keys(child.system.activities)) {

          if (ignoredConsumptionActivities?.includes(child.system.activities[id].name)) continue;
          const targets = child.system.activities[id].consumption.targets;
          const cost = foundry.utils.getProperty(child, "flags.ddbimporter.consumptionValue") ?? spellData.cost;

          if (foundry.utils.getProperty(child, "flags.ddbimporter.retainOriginalConsumption")) {
            targets.push(
              {
                target: _qualifiedConsumptionTarget(parent),
                value: `${cost}`,
                type: "itemUses",
              },
            );
            foundry.utils.setProperty(update, `system.activities.${id}.consumption.targets`, targets);
          } else {
            foundry.utils.setProperty(update, `system.activities.${id}.consumption.targets`, [{
              target: _qualifiedConsumptionTarget(parent),
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
  const usesUpdate = _childUsesUpdate(child);
  if (usesUpdate) {
    update.system["uses"] = usesUpdate;
  }
  const ignoredConsumptionActivities = foundry.utils.getProperty(child, "flags.ddbimporter.ignoredConsumptionActivities");
  for (const id of Object.keys(child.system.activities)) {
    if (ignoredConsumptionActivities?.includes(child.system.activities[id].name)) continue;
    const targets = child.system.activities[id].consumption.targets;
    const value = foundry.utils.getProperty(child, "flags.ddbimporter.consumptionValue") ?? 1;
    // only retarget itemUses entries; the parser may push an attribute resource
    // target first and that must not be pointed at an item
    const itemUsesTarget = targets.find((target) => target.type === "itemUses");
    if (foundry.utils.getProperty(child, "flags.ddbimporter.retainOriginalConsumption")) {
      targets.push({
        type: "itemUses",
        value,
        target: _qualifiedConsumptionTarget(parent),
      });
      foundry.utils.setProperty(update, `system.activities.${id}.consumption.targets`, targets);
    } else if (itemUsesTarget) {
      itemUsesTarget.target = _qualifiedConsumptionTarget(parent);
      foundry.utils.setProperty(update, `system.activities.${id}.consumption.targets`, targets);
    } else if (targets.length > 0) {
      // non-itemUses targets (attribute resource, hitDice) stay; add the pool link
      targets.push({
        type: "itemUses",
        value,
        target: _qualifiedConsumptionTarget(parent),
      });
      foundry.utils.setProperty(update, `system.activities.${id}.consumption.targets`, targets);
    } else {
      foundry.utils.setProperty(update, `system.activities.${id}.consumption`, {
        spellSlot: false,
        targets: [{
          type: "itemUses",
          value,
          target: _qualifiedConsumptionTarget(parent),
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


DDBCharacter.prototype._getAutoLinkActivityDictionaryUpdates = async function _getAutoLinkActivityDictionaryUpdates(this: DDBCharacter) {
  const possibleItems = this.currentActor.items.toObject();
  const toUpdate = [];

  for (const [resourceDocName, consumingDocs] of Object.entries(DICTIONARY.CONSUMPTION_LINKS)) {
    logger.debug(`Generic Resource Linking: Checking ${resourceDocName}`, consumingDocs);
    const parent = _findConsumptionParent(possibleItems, resourceDocName);

    if (!parent) continue;
    logger.debug("parent", parent);
    _findChildUpdates({ consumingDocs, possibleItems, parent }).forEach((update) => {
      toUpdate.push(update);
    });
  }
  return toUpdate;
};

DDBCharacter.prototype._getAutoLinkActivityFlagDocUpdates = async function _getAutoLinkActivityFlagDocUpdates(this: DDBCharacter) {
  const possibleItems = this.currentActor.items.toObject();
  const toUpdate = [];

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
        const targetName = target.target;
        if (!targetName) continue;
        const parent = _findConsumptionParent(possibleItems, targetName);
        if (parent) {
          target.target = _qualifiedConsumptionTarget(parent);
        } else {
          target.target = _unresolvedConsumptionTarget(targetName);
        }
      }
      foundry.utils.setProperty(update, `system.activities.${id}.consumption.targets`, targets);
    }

    toUpdate.push(update);
  }

  return toUpdate;
};

DDBCharacter.prototype._flagCleanup = async function _flagCleanup(this: DDBCharacter) {
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

DDBCharacter.prototype.autoLinkConsumption = async function autoLinkConsumption(this: DDBCharacter) {
  const toUpdate = [];

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
