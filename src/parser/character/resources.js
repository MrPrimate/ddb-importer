import DICTIONARY from "../../dictionary.js";

function resourceList(data) {
  const resources = [data.character.actions.race, data.character.actions.class, data.character.actions.feat]
    .flat()
    .filter((action) =>
      action.limitedUse &&
        (action.limitedUse.maxUses || action.limitedUse.statModifierUsesId || action.limitedUse.useProficiencyBonus));

  return resources;
}

function getSortedByUsedResourceList(data, character) {
  // get all resources
  const allResources = resourceList(data);
  const resources = allResources
    .map((action) => {
      let maxUses = (action.limitedUse.maxUses && action.limitedUse.maxUses !== -1) ? action.limitedUse.maxUses : 0;

      if (action.limitedUse.statModifierUsesId) {
        const ability = DICTIONARY.character.abilities.find(
          (ability) => ability.id === action.limitedUse.statModifierUsesId
        ).value;

        switch (action.limitedUse.operator) {
          case 2: {
            maxUses *= character.flags.ddbimporter.dndbeyond.effectAbilities[ability].mod;
            break;
          }
          case 1:
          default:
            maxUses += character.flags.ddbimporter.dndbeyond.effectAbilities[ability].mod;
        }
      }

      if (action.limitedUse.useProficiencyBonus) {
        switch (action.limitedUse.proficiencyBonusOperator) {
          case 2: {
            maxUses *= character.data.attributes.prof;
            break;
          }
          case 1:
          default:
            maxUses += character.data.attributes.prof;
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
}

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

export function getResources(data, character, numberOfResources = 3) {
  // get all resources
  const allResources = getSortedByUsedResourceList(data, character);

  let result = {};

  const resourceSelectionType = hasProperty(character, "flags.ddbimporter.resources")
    ? getProperty(character, "flags.ddbimporter.resources")
    : { type: "default" };

  switch (resourceSelectionType.type) {
    case "custom": {
      const customResourceSelection = getProperty(character, "flags.ddbimporter.resources");
      for (let i = 0; i < sheetResources.length && i < numberOfResources; i++) {
        const resourceLookupName = customResourceSelection[sheetResources[i]];

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
    default: {
      const usedResources = allResources.slice(0, numberOfResources);
      for (let i = 0; i < sheetResources.length && i < numberOfResources; i++) {
        const resource = usedResources.length > i ? usedResources[i] : { value: 0, max: 0, sr: false, lr: false, label: "" };
        result[sheetResources[i]] = resource;
      };
      break;
    }
  }

  return result;
}

export function getResourceList(data, character) {
  return getSortedByUsedResourceList(data, character);
}

function generateResourceSelectionFromForm(formData, type) {
  const primary = formData.find((r) => r.name === "primary-select" && r.value !== "");
  const secondary = formData.find((r) => r.name === "secondary-select" && r.value !== "");
  const tertiary = formData.find((r) => r.name === "tertiary-select" && r.value !== "");
  const ask = formData.find((r) => r.name === "ask-resources")?.value === "on";

  const resourceSelection = {
    type: type,
    primary: type === "custom" && primary ? primary.value : "",
    secondary: type === "custom" && secondary ? secondary.value : "",
    tertiary: type === "custom" && tertiary ? tertiary.value : "",
    ask,
  };
  return resourceSelection;
}

function setResourceType(ddb, character, resourceSelection) {
  setProperty(character, "flags.ddbimporter.resources", resourceSelection);
  setProperty(character, "data.resources", getResources(ddb, character));
  return character;
}

function setDefaultResources(sortedResources, resourceSelection) {
  if (sortedResources.length >= 1) {
    resourceSelection.primary = sortedResources[0].label;
  }
  if (sortedResources.length >= 2) {
    resourceSelection.secondary = sortedResources[1].label;
  }
  if (sortedResources.length >= 3) {
    resourceSelection.tertiary = sortedResources[2].label;
  }
  return resourceSelection;
}

export async function getResourcesDialog(currentActorId, ddb, character) {
  const currentActor = game.actors.get(currentActorId);
  return new Promise((resolve) => {
    let currentResourceSelection = hasProperty(currentActor, "data.flags.ddbimporter.resources.type")
      ? getProperty(currentActor, "data.flags.ddbimporter.resources")
      : {
        ask: true,
        type: "default",
        primary: "",
        secondary: "",
        tertiary: "",
      };

    const sortedResources = getSortedByUsedResourceList(ddb, character);

    if (currentResourceSelection.type === "default") {
      currentResourceSelection = setDefaultResources(sortedResources, currentResourceSelection);
    }

    if (currentResourceSelection.ask || !hasProperty(currentResourceSelection, "ask")) {
      const resources = sortedResources.map((resource) => {
        let resourceArray = [];
        if (resource.sr) resourceArray.push("SR");
        if (resource.lr) resourceArray.push("LR");
        if (!resource.sr && !resource.lr) resourceArray.push("Other");
        resource.resetString = resourceArray.join(", ");
        switch (resource.label) {
          case currentResourceSelection.primary:
            resource.primary = true;
            break;
          case currentResourceSelection.secondary:
            resource.secondary = true;
            break;
          case currentResourceSelection.tertiary:
            resource.tertiary = true;
            break;
          // no default
        }
        return resource;
      });

      const dialog = new Dialog({
        title: `Choose Resources for ${character.name}`,
        content: {
          "resources": resources,
          "character": character.name,
          "img": ddb.character.decorations?.avatarUrl
            ? ddb.character.decorations.avatarUrl
            : "icons/svg/mystery-man.svg",
          "cssClass": "character-resource-selection sheet"
        },
        buttons: {
          default: {
            icon: '<i class="fas fa-list-ol"></i>',
            label: "Default",
            callback: async () => {
              const formData = $('.character-resource-selection').serializeArray();
              let resourceSelection = generateResourceSelectionFromForm(formData, "default");
              resourceSelection = setDefaultResources(resources, resourceSelection);
              character = setResourceType(ddb, character, resourceSelection);
              resolve(character);
            }
          },
          custom: {
            icon: '<i class="fas fa-sort"></i>',
            label: "Use selected",
            callback: async () => {
              const formData = $('.character-resource-selection').serializeArray();
              const resourceSelection = generateResourceSelectionFromForm(formData, "custom");
              character = setResourceType(ddb, character, resourceSelection);
              resolve(character);
            }
          },
          disable: {
            icon: '<i class="fas fa-times"></i>',
            label: "None",
            callback: async () => {
              const formData = $('.character-resource-selection').serializeArray();
              const resourceSelection = generateResourceSelectionFromForm(formData, "disable");
              character = setResourceType(ddb, character, resourceSelection);
              resolve(character);
            }
          }
        },
        default: "default",
        close: () => resolve(character),
      },
      {
        width: 400,
        classes: ["dialog", "character-resource-selection"],
        template: "modules/ddb-importer/handlebars/resources.hbs",
      });
      dialog.render(true);
    } else {
      character = setResourceType(ddb, character, currentResourceSelection);
      resolve(character);
    }
  });
}
