import DICTIONARY from "../../dictionary.js";

function resourceList(data) {
  const genResources = game.settings.get("ddb-importer", "character-update-policy-use-resources");
  const resources = genResources
    ? [data.character.actions.race, data.character.actions.class, data.character.actions.feat]
      .flat()
      .filter((action) =>
        action.limitedUse &&
        (action.limitedUse.maxUses || action.limitedUse.statModifierUsesId || action.limitedUse.useProficiencyBonus))
    : [];

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
  const usedResources = allResources.slice(0, numberOfResources);

  let result = {};

  const resourceSelectionType = hasProperty(character, "flags.ddbimporter.resources.type")
    ? getProperty(character, "flags.ddbimporter.resources.type")
    : "default";

  switch (resourceSelectionType) {
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

export async function getResourcesDialog(currentActorId, ddb, character) {
  const currentActor = game.actors.get(currentActorId);
  return new Promise((resolve) => {
    let currentResourceSelection = hasProperty(currentActor, "data.flags.ddbimporter.resources.type")
      ? getProperty(currentActor, "data.flags.ddbimporter.resources")
      : {
        ask: true,
        type: "default",
        primary: undefined,
        secondary: undefined,
        tertiary: undefined,
      };

    if (currentResourceSelection.ask || !hasProperty(currentResourceSelection, "ask")) {
      const resources = getSortedByUsedResourceList(ddb, character).map((resource) => {
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
      if (!currentResourceSelection.primary && resources.length >= 1) {
        resources[0].primary = true;
      }
      if (!currentResourceSelection.secondary && resources.length >= 2) {
        resources[1].secondary = true;
      }
      if (!currentResourceSelection.tertiary && resources.length >= 3) {
        resources[2].tertiary = true;
      }

      const dialog = new Dialog({
        title: "Choose Resources",
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
            const ask = formData.find((r) => r.name === "ask-resources")?.value === "on";
            const resourceSelection = {
              type: "default",
              ask,
            };
            setProperty(character, "flags.ddbimporter.resources", resourceSelection);
            resolve(character);
          }
        },
        custom: {
          icon: '<i class="fas fa-sort"></i>',
          label: "Use selected",
          callback: async () => {
            const formData = $('.character-resource-selection').serializeArray();
            const primary = formData.find((r) => r.name === "primary-select" && r.value !== "");
            const secondary = formData.find((r) => r.name === "secondary-select" && r.value !== "");
            const tertiary = formData.find((r) => r.name === "tertiary-select" && r.value !== "");
            const ask = formData.find((r) => r.name === "ask-resources")?.value === "on";

            const resourceSelection = {
              type: "custom",
              primary: primary ? primary.value : "",
              secondary: secondary ? secondary.value : "",
              tertiary: tertiary ? tertiary.value : "",
              ask,
            };
            setProperty(character, "flags.ddbimporter.resources", resourceSelection);
            setProperty(character, "data.resources", getResources(ddb, character));
            resolve(character);
          }
        },
        disable: {
          icon: '<i class="fas fa-times"></i>',
          label: "None",
          callback: async () => {
            const formData = $('.character-resource-selection').serializeArray();
            const ask = formData.find((r) => r.name === "ask-resources")?.value === "on";
            const resourceSelection = {
              type: "disable",
              ask,
            };
            setProperty(character, "flags.ddbimporter.resources", resourceSelection);
            setProperty(character, "data.resources", getResources(ddb, character));
            resolve(character);
          }
        }
        },
        default: "default",
        close: () => resolve(character),
      },
      {
        width: 700,
        classes: ["dialog", "character-resource-selection"],
        template: "modules/ddb-importer/handlebars/resources.hbs",
      });
      dialog.render(true);
    } else {
      setProperty(character, "flags.ddbimporter.resources", currentResourceSelection);
      setProperty(character, "data.resources", getResources(ddb, character));
      resolve(character);
    }
  });
}

window.getResourcesDialog = getResourcesDialog;
