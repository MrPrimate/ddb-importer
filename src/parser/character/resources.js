import DICTIONARY from "../../dictionary.js";
import logger from "../../logger.js";
import DDBCharacter from "../DDBCharacter.js";

DDBCharacter.prototype.resourceList = function resourceList() {
  const resources = [this.source.ddb.character.actions.race, this.source.ddb.character.actions.class, this.source.ddb.character.actions.feat]
    .flat()
    .filter((action) =>
      action.limitedUse
        && (action.limitedUse.maxUses || action.limitedUse.statModifierUsesId || action.limitedUse.useProficiencyBonus)
        && !["Hypnotic Gaze"].includes(action.name));

  return resources;
};

DDBCharacter.prototype.getSortedByUsedResourceList = function getSortedByUsedResourceList() {
  // get all resources
  const allResources = this.resourceList();
  const resources = allResources
    .map((action) => {
      let maxUses = (action.limitedUse.maxUses && action.limitedUse.maxUses !== -1) ? action.limitedUse.maxUses : 0;

      if (action.limitedUse.statModifierUsesId) {
        const ability = DICTIONARY.character.abilities.find(
          (ability) => ability.id === action.limitedUse.statModifierUsesId,
        ).value;

        switch (action.limitedUse.operator) {
          case 2: {
            maxUses *= this.raw.character.flags.ddbimporter.dndbeyond.effectAbilities[ability].mod;
            break;
          }
          case 1:
          default:
            maxUses += this.raw.character.flags.ddbimporter.dndbeyond.effectAbilities[ability].mod;
        }
      }

      if (action.limitedUse.useProficiencyBonus) {
        switch (action.limitedUse.proficiencyBonusOperator) {
          case 2: {
            maxUses *= this.raw.character.system.attributes.prof;
            break;
          }
          case 1:
          default:
            maxUses += this.raw.character.system.attributes.prof;
        }
      }

      return {
        label: action.name,
        value: maxUses - action.limitedUse.numberUsed,
        max: maxUses,
        sr: action.limitedUse.resetType === 1,
        lr: action.limitedUse.resetType === 1 || action.limitedUse.resetType === 2 || action.limitedUse.resetType === 3,
      };
    })
    // sort by maxUses, I guess one wants to track the most uses first, because it's used more often
    .sort((a, b) => {
      if (a.max > b.max) return -1;
      if (a.max < b.max) return 1;
      return 0;
    });
  return resources;
};

const sheetResources = [
  "primary",
  "secondary",
  "tertiary",
  "fourth",
  "fifth",
  "sixth",
  "seventh",
  "eighth",
  "ninth",
  "tenth",
  "eleventh",
  "twelfth",
  "thirteenth",
  "fourteenth",
  "fifteenth",
  "sixteenth",
  "seventeenth",
  "eighteenth",
  "nineteenth",
  "twentieth",
];

DDBCharacter.prototype._generateResources = function _generateResources(numberOfResources = 3) {
  // get all resources
  const allResources = this.getSortedByUsedResourceList();

  let result = {};

  switch (this.resourceChoices.type) {
    case "custom": {
      for (let i = 0; i < sheetResources.length && i < numberOfResources; i++) {
        const resourceLookupName = this.resourceChoices[sheetResources[i]];

        const resource = resourceLookupName && resourceLookupName !== ""
          ? allResources.find((r) => r.label === resourceLookupName)
          : { value: 0, max: 0, sr: false, lr: false, label: "" };
        result[sheetResources[i]] = resource || { value: 0, max: 0, sr: false, lr: false, label: "" };
      };
      break;
    }
    case "disable": {
      for (let i = 0; i < sheetResources.length && i < numberOfResources; i++) {
        result[sheetResources[i]] = { value: 0, max: 0, sr: false, lr: false, label: "" };
      };
      break;
    }
    case "remove": {
      for (let i = 0; i < sheetResources.length && i < numberOfResources; i++) {
        result[sheetResources[i]] = { value: 0, max: 0, sr: false, lr: false, label: "" };
      };
      break;
    }
    default: {
      const usedResources = allResources.slice(0, numberOfResources);
      for (let i = 0; i < sheetResources.length && i < numberOfResources; i++) {
        const resource = usedResources.length > i ? usedResources[i] : { value: 0, max: 0, sr: false, lr: false, label: "" };
        result[sheetResources[i]] = resource;
      };
      break;
    }
  }

  this.resources = result;
  foundry.utils.setProperty(this.raw.character, "flags.ddbimporter.resources", this.resourceChoices);
  foundry.utils.setProperty(this.raw.character, "system.resources", result);
};

DDBCharacter.prototype.getResourceList = function getResourceList() {
  return this.getSortedByUsedResourceList();
};

DDBCharacter.prototype._generateResourceSelectionFromForm = function _generateResourceSelectionFromForm(formData, type) {
  const primary = formData.find((r) => r.name === "primary-select" && r.value !== "");
  const secondary = formData.find((r) => r.name === "secondary-select" && r.value !== "");
  const tertiary = formData.find((r) => r.name === "tertiary-select" && r.value !== "");
  const ask = formData.find((r) => r.name === "ask-resources")?.value === "on";

  const resourceSelection = {
    type: type,
    primary: type === "custom" && primary ? primary.value : "",
    secondary: type === "custom" && secondary ? secondary.value : "",
    tertiary: type === "custom" && tertiary ? tertiary.value : "",
    ask: type === "remove" ? false : ask,
  };

  this.resourceChoices = resourceSelection;
};

DDBCharacter.prototype.setDefaultResources = function setDefaultResources(sortedResources) {
  if (sortedResources.length >= 1) {
    this.resourceChoices.primary = sortedResources[0].label;
  }
  if (sortedResources.length >= 2) {
    this.resourceChoices.secondary = sortedResources[1].label;
  }
  if (sortedResources.length >= 3) {
    this.resourceChoices.tertiary = sortedResources[2].label;
  }
};

// this.source.ddb, this.raw.character
DDBCharacter.prototype.resourceSelectionDialog = async function resourceSelectionDialog() {
  return new Promise((resolve) => {
    const sortedResources = this.getSortedByUsedResourceList();

    if (this.resourceChoices.type === "default") {
      this.setDefaultResources(sortedResources);
    }

    if (this.resourceChoices.ask || !foundry.utils.hasProperty(this.resourceChoices, "ask")) {
      const resources = sortedResources.map((resource) => {
        let resourceArray = [];
        if (resource.sr) resourceArray.push("SR");
        if (resource.lr) resourceArray.push("LR");
        if (!resource.sr && !resource.lr) resourceArray.push("Other");
        resource.resetString = resourceArray.join(", ");
        switch (resource.label) {
          case this.resourceChoices.primary:
            resource.primary = true;
            break;
          case this.resourceChoices.secondary:
            resource.secondary = true;
            break;
          case this.resourceChoices.tertiary:
            resource.tertiary = true;
            break;
          // no default
        }
        return resource;
      });

      const dialog = new Dialog({
        title: `Choose Resources for ${this.raw.character.name}`,
        content: {
          "resources": resources,
          "character": this.raw.character.name,
          "img": this.source.ddb.character.decorations?.avatarUrl
            ? this.source.ddb.character.decorations.avatarUrl
            : CONST.DEFAULT_TOKEN,
          "cssClass": "character-resource-selection sheet",
        },
        buttons: {
          default: {
            // icon: '<i class="fas fa-list-ol"></i>',
            // label: "Auto",
            callback: async () => {
              const formData = $('.character-resource-selection').serializeArray();
              this._generateResourceSelectionFromForm(formData, "default");
              this.setDefaultResources(sortedResources);
              this._generateResources();
              resolve(this.raw.character);
            },
          },
          custom: {
            // icon: '<i class="fas fa-sort"></i>',
            // label: "Custom",
            callback: async () => {
              const formData = $('.character-resource-selection').serializeArray();
              this._generateResourceSelectionFromForm(formData, "custom");
              resolve(this.raw.character);
            },
          },
          disable: {
            callback: async () => {
              const formData = $('.character-resource-selection').serializeArray();
              this._generateResourceSelectionFromForm(formData, "disable");
              this._generateResources();
              resolve(this.raw.character);
            },
          },
          remove: {
            callback: async () => {
              const formData = $('.character-resource-selection').serializeArray();
              this._generateResourceSelectionFromForm(formData, "remove");
              this._generateResources();
              resolve(this.raw.character);
            },
          },
        },
        default: "default",
        close: () => resolve(this.raw.character),
      },
      {
        width: 400,
        classes: ["dialog", "character-resource-selection"],
        template: "modules/ddb-importer/handlebars/resources.hbs",
      });
      dialog.render(true);
    } else {
      this._generateResources();
      resolve(this.raw.character);
    }
  });
};

// const chargeTypeMap = {
//   "Lay on Hands": {
//     "type": "none",
//   },
// };

const notReplace = {
  "Starry Form": ["Starry Form: Archer", "Starry Form: Chalice", "Starry Form: Dragon"],
};


// KNOWN_ISSUE_4_0: update for activities
// DDBCharacter.prototype.fixItemSpellResources = async function fixItemSpellResources() {
//   const possibleItems = this.currentActor.items.toObject();
//   let toUpdate = [];

//   for (const spell of possibleItems) {
//     if (spell.type !== "spell") continue;
//     if (!foundry.utils.getProperty(spell, "flags.ddbimporter.isItemCharge")) continue;
//     if (foundry.utils.getProperty(spell, "flags.ddbimporter.dndbeyond.lookup") !== "item") continue;
//     const spellLookupId = foundry.utils.getProperty(spell, "flags.ddbimporter.dndbeyond.lookupId");
//     if (!spellLookupId) continue;
//     const parentDoc = possibleItems.find((item) =>
//       spellLookupId === item.flags?.ddbimporter?.definitionId,
//     );
//     if (!parentDoc) continue;
//     toUpdate.push({
//       _id: spell._id,
//       // TODO: update for activities
//       "system.consume.target": parentDoc._id,
//       "system.uses.prompt": false,
//     });
//   }

//   {
//     _id: "GGJwqQSD1RqJx7RE",
//     "system.activities.ddbStepOfTheWinI.consumption": {
//       "targets": [
//           {
//               "type": "itemUses",
//               "target": "",
//               "value": "1",
//               "scaling": {
//                   "mode": "",
//                   "formula": ""
//               }
//           }
//       ],
//       "spellSlot": false
//     }
//   }

//   logger.debug("itemSpellsToUpdate", toUpdate);

//   const results = await this.currentActor.updateEmbeddedDocuments("Item", toUpdate);
//   logger.debug("itemSpellsToUpdate results", results);

// };

DDBCharacter.prototype.autoLinkResources = async function autoLinkResources() {
  // loop over resourceFeatureLinkMap
  const possibleItems = this.currentActor.items.toObject();
  let toUpdate = [];

  for (const [resourceDocName, consumingDocs] of Object.entries(DICTIONARY.RESOURCE_LINKS)) {
    logger.debug(`Generic Resource Linking: Checking ${resourceDocName}`, consumingDocs);
    const parent = possibleItems.find((doc) => {
      const name = doc.flags.ddbimporter?.originalName ?? doc.name;
      return name === resourceDocName;
    });

    if (parent) {
      logger.debug("parent", parent);
      consumingDocs.forEach((consumingDocName) => {
        logger.debug(`Checking ${consumingDocName}`);
        const children = possibleItems.filter((doc) => {
          const name = doc.flags.ddbimporter?.originalName ?? doc.name;
          const dontReplace = notReplace[consumingDocName]?.includes(name);
          return name.startsWith(consumingDocName) && !dontReplace;
        });

        if (children) {
          logger.debug(`Found children`, children);
          children.forEach((child) => {
            if (foundry.utils.getProperty(child, "flags.ddbimporter.retainResourceConsumption")) return;
            logger.debug("child", child);
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

            toUpdate.push(update);
          });
        }
      });
    }
  }

  for (const [featureName, linkedSpellArray] of Object.entries(DICTIONARY.RESOURCE_SPELL_LINKS)) {
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
      toUpdate.push(update);
    }
  }

  logger.debug("toUpdate", toUpdate);

  const results = await this.currentActor.updateEmbeddedDocuments("Item", toUpdate);
  logger.debug("resource Update results", results);
};
