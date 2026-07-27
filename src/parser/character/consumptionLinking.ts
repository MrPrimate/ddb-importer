import { DICTIONARY } from "../../config/_module";
import { logger, utils } from "../../lib/_module";
import DDBCharacter from "../DDBCharacter";

const notReplace = {
  "Starry Form": ["Starry Form: Archer", "Starry Form: Chalice", "Starry Form: Dragon"],
};


DDBCharacter.prototype._getAutoLinkActivityDictionarySpellLinkUpdates = async function _getAutoLinkActivityDictionarySpellLinkUpdates(this: DDBCharacter): Promise<Partial<I5ePCConsumptionItems>[]> {
  if (!this.currentActor) {
    logger.warn("Unable to link spell consumption, no current actor");
    return [];
  }
  const items = this.currentActor.items as Actor.Implementation["items"];
  const possibleItems = items.toObject() as unknown as I5ePCConsumptionItems[];
  const toUpdate: Partial<I5ePCConsumptionItems>[] = [];

  for (const [featureName, linkedSpellArray] of Object.entries(DICTIONARY.CONSUMPTION_SPELL_LINKS)) {
    logger.debug(`Resource Spells: Checking ${featureName}`, linkedSpellArray);
    const parent = possibleItems.find((doc) => {
      const name = doc.flags.ddbimporter?.originalName ?? doc.name;
      return name === featureName;
    });
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
      const child = possibleItems.find((doc): doc is I5eSpellItem => {
        if (doc.type !== "spell") return false;
        const name = doc.flags.ddbimporter?.originalName ?? doc.name;
        const lookupName = doc.flags.ddbimporter?.dndbeyond?.lookupName ?? "NO_LOOKUP_NAME";
        return name === spellData.name && spellData.lookupName === lookupName;
      });

      if (!child) continue;

      if (foundry.utils.getProperty(child, "flags.ddbimporter.retainResourceConsumption"))
        continue;

      logger.debug(`Resource Spells: ${featureName} child:`, child);
      const update: Record<string, any> = {
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
      if (spellData.cost !== 0 && "activities" in child.system) {
        const ignoredConsumptionActivities = foundry.utils.getProperty(child, "flags.ddbimporter.ignoredConsumptionActivities") as string[] | undefined;
        for (const id of Object.keys(child.system.activities)) {

          const activity = child.system.activities[id];
          if (ignoredConsumptionActivities?.includes(activity.name ?? "")) continue;
          const targets = activity.consumption?.targets ?? [];
          const cost = foundry.utils.getProperty(child, "flags.ddbimporter.consumptionValue") ?? spellData.cost;

          if (foundry.utils.getProperty(child, "flags.ddbimporter.retainOriginalConsumption")) {
            targets.push(
              {
                target: `${parent.type}:${parent.system.identifier}`,
                value: `${cost}`,
                type: "itemUses",
              },
            );
            foundry.utils.setProperty(update, `system.activities.${id}.consumption.targets`, targets);
          } else {
            foundry.utils.setProperty(update, `system.activities.${id}.consumption.targets`, [{
              target: `${parent.type}:${parent.system.identifier}`,
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


function _generateChildUpdate({ child, parent }: {
  child: I5ePCConsumptionItems;
  parent: I5ePCConsumptionItems;
}): Partial<I5ePCConsumptionItems> {
  const update: Partial<I5ePCConsumptionItems> = {
    _id: child._id,
  };
  foundry.utils.setProperty(update, "system", {});
  if (!foundry.utils.getProperty(child, "flags.ddbimporter.retainChildUses")) {
    (update.system as Record<string, any>)["uses"] = {
      spent: null,
      max: "",
    };
  }
  if (!("activities" in child.system)) return update;
  const ignoredConsumptionActivities = foundry.utils.getProperty(child, "flags.ddbimporter.ignoredConsumptionActivities") as string[] | undefined;
  for (const id of Object.keys(child.system.activities)) {
    const activity = child.system.activities[id];
    if (ignoredConsumptionActivities?.includes(activity.name ?? "")) continue;
    const targets = activity.consumption?.targets ?? [];
    const value = foundry.utils.getProperty(child, "flags.ddbimporter.consumptionValue") as string ?? "1";
    if (foundry.utils.getProperty(child, "flags.ddbimporter.retainOriginalConsumption")) {
      targets.push({
        type: "itemUses",
        value,
        target: `${parent.type}:${parent.system.identifier}`,
      });
      foundry.utils.setProperty(update, `system.activities.${id}.consumption.targets`, targets);
    } else if (targets.length > 0) {
      targets[0].target = `${parent.type}:${parent.system.identifier}`;
      foundry.utils.setProperty(update, `system.activities.${id}.consumption.targets`, targets);
    } else {
      foundry.utils.setProperty(update, `system.activities.${id}.consumption`, {
        spellSlot: false,
        targets: [{
          type: "itemUses",
          value,
          target: `${parent.type}:${parent.system.identifier}`,
        }],
      });
    }
  }
  return update;
}


function _findChildUpdates({ consumingDocs, possibleItems, parent }: {
  consumingDocs: string[];
  possibleItems: I5ePCConsumptionItems[];
  parent: I5ePCConsumptionItems;
}) {
  const toUpdate: Partial<I5ePCConsumptionItems>[] = [];
  logger.debug("parent", parent);
  consumingDocs.forEach((consumingDocName) => {
    logger.debug(`Checking ${consumingDocName}`);
    const children = possibleItems.filter((doc) => {
      const name = doc.flags.ddbimporter?.originalName ?? doc.name;
      const dontReplace = notReplace[consumingDocName as keyof typeof notReplace]?.includes(name);
      if (dontReplace) return false;
      if (name.startsWith(consumingDocName)) return true;

      const additional = foundry.utils.getProperty(doc, "flags.ddbimporter.defaultAdditionalActivities") as { enabled?: boolean; data?: { featureName?: string } } | undefined;
      if (!additional?.enabled) return false;
      if (!additional.data?.featureName) return false;
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


DDBCharacter.prototype._getAutoLinkActivityDictionaryUpdates = async function _getAutoLinkActivityDictionaryUpdates(this: DDBCharacter): Promise<Partial<I5ePCConsumptionItems>[]> {
  if (!this.currentActor) {
    logger.warn("Unable to link consumption, no current actor");
    return [];
  }
  const items = this.currentActor.items as Actor.Implementation["items"];
  const possibleItems = items.toObject() as unknown as I5ePCConsumptionItems[];
  const toUpdate: Partial<I5ePCConsumptionItems>[] = [];

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

DDBCharacter.prototype._getAutoLinkActivityFlagDocUpdates = async function _getAutoLinkActivityFlagDocUpdates(this: DDBCharacter): Promise<Partial<I5ePCConsumptionItems>[]> {
  if (!this.currentActor) {
    logger.warn("Unable to link activity flag consumption, no current actor");
    return [];
  }
  const items = this.currentActor.items as Actor.Implementation["items"];
  const possibleItems = items.toObject() as unknown as I5ePCConsumptionItems[];
  const toUpdate: Partial<I5ePCConsumptionItems>[] = [];

  const activityFlagDocs = possibleItems.filter((doc) =>
    foundry.utils.getProperty(doc, "flags.ddbimporter.replaceActivityUses") !== undefined,
  );
  for (const childDoc of activityFlagDocs) {
    if (foundry.utils.getProperty(childDoc, "flags.ddbimporter.retainResourceConsumption")) continue;
    logger.debug("updateDoc", childDoc);
    const update: Partial<I5ePCConsumptionItems> = {
      _id: childDoc._id,
    };

    if(!("activities" in childDoc.system)) continue;
    const ignoredConsumptionActivities = foundry.utils.getProperty(childDoc, "flags.ddbimporter.ignoredConsumptionActivities") as string[] | undefined;
    for (const id of Object.keys(childDoc.system.activities)) {
      const activity = childDoc.system.activities[id];
      if (ignoredConsumptionActivities?.includes(activity.name ?? "")) continue;
      const targets = activity.consumption?.targets ?? [];

      for (const target of targets) {
        if (target.type !== "itemUses") continue;
        const targetName = target.target;
        if (!targetName) continue;
        const parent = possibleItems.find((doc) => {
          const name = doc.flags.ddbimporter?.originalName ?? doc.name;
          return name === targetName;
        });
        if (parent) {
          target.target = `${parent.type}:${parent.system.identifier}`;
        } else {
          target.target = utils.referenceNameString(targetName).toLowerCase();
        }
      }
      foundry.utils.setProperty(update, `system.activities.${id}.consumption.targets`, targets);
    }

    toUpdate.push(update);
  }

  return toUpdate;
};

DDBCharacter.prototype._flagCleanup = async function _flagCleanup(this: DDBCharacter) {
  if (!this.currentActor) {
    logger.warn("Unable to clean up consumption flags, no current actor");
    return;
  }
  const items = this.currentActor.items as Actor.Implementation["items"];
  const possibleItems = items.toObject() as unknown as I5ePCConsumptionItems[];
  const toUpdate = possibleItems
    .filter((doc) => foundry.utils.getProperty(doc, "flags.ddbimporter.defaultAdditionalActivities") !== undefined)
    .map((doc) => {
      return {
        _id: doc._id,
        flags: {
          ddbimporter: {
            "-=defaultAdditionalActivities": null as null,
          },
        },
      };
    });

  await this.currentActor.updateEmbeddedDocuments("Item", toUpdate as unknown as Item.UpdateData[]);
  logger.debug("Flag cleanup updates", toUpdate);
};

DDBCharacter.prototype.autoLinkConsumption = async function autoLinkConsumption(this: DDBCharacter) {
  if (!this.currentActor) {
    logger.warn("Unable to auto link consumption, no current actor");
    return;
  }
  const toUpdate = [];

  const activityFlagUpdates = await this._getAutoLinkActivityFlagDocUpdates();
  toUpdate.push(...activityFlagUpdates);

  const activityDictionaryUpdates = await this._getAutoLinkActivityDictionaryUpdates();
  toUpdate.push(...activityDictionaryUpdates);

  const spellUpdates = await this._getAutoLinkActivityDictionarySpellLinkUpdates();
  toUpdate.push(...spellUpdates);

  logger.debug("toUpdate", toUpdate);

  const results = await this.currentActor.updateEmbeddedDocuments("Item", toUpdate as unknown as Item.UpdateData[]);
  logger.debug("resource Update results", results);

  await this._flagCleanup();

};
