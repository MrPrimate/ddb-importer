import DICTIONARY from "../../dictionary.js";

function resourceList(data) {
  const genResources = game.settings.get("ddb-importer", "character-update-policy-use-resources");
  const resources = genResources
    ? [data.character.actions.race, data.character.actions.class, data.character.actions.feat]
      .flat()
      // let resources = data.character.actions.class
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
        lr: action.limitedUse.resetType === 1 || action.limitedUse.resetType === 2,
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

  for (let i = 0; i < sheetResources.length && i < numberOfResources; i++) {
    const resource = usedResources.length > i ? usedResources[i] : { value: 0, max: 0, sr: false, lr: false, label: "" };
    result[sheetResources[i]] = resource;
  }

  return result;
}
