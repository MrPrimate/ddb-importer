import DICTIONARY from "../../dictionary.js";

const DEFAULT_USE = {
  value: null,
  max: null,
  per: "",
};

/**
 * Get the reset condition of the spell, if uses restricted
 * @param {*} data Spell data
 * @param {*} character Character data
 */
export function getUses(data, character) {
  // we check this, as things like items have useage attached to the item, not spell
  const limitedUse = foundry.utils.getProperty(data, "flags.ddbimporter.dndbeyond.limitedUse") ?? data.limitedUse;

  if (!limitedUse) return DEFAULT_USE;
  const resetType = DICTIONARY.resets.find((reset) => reset.id == limitedUse.resetType);
  if (!resetType) return DEFAULT_USE;

  if (limitedUse.maxUses || limitedUse.statModifierUsesId || limitedUse.useProficiencyBonus) {
    let maxUses = (limitedUse.maxUses && limitedUse.maxUses !== -1) ? limitedUse.maxUses : 0;

    if (limitedUse.statModifierUsesId) {
      const ability = DICTIONARY.character.abilities.find(
        (ability) => ability.id === limitedUse.statModifierUsesId
      ).value;

      switch (limitedUse.operator) {
        case 2: {
          maxUses *= character.flags.ddbimporter.dndbeyond.effectAbilities[ability].mod;
          break;
        }
        case 1:
        default:
          maxUses += character.flags.ddbimporter.dndbeyond.effectAbilities[ability].mod;
      }
    }

    if (limitedUse.useProficiencyBonus) {
      switch (limitedUse.proficiencyBonusOperator) {
        case 2: {
          maxUses *= character.system.attributes.prof;
          break;
        }
        case 1:
        default:
          maxUses += character.system.attributes.prof;
      }
    }

    const finalMaxUses = (maxUses) ? parseInt(maxUses) : null;

    return {
      value: (finalMaxUses !== null && finalMaxUses != 0) ? maxUses - limitedUse.numberUsed : null,
      max: (finalMaxUses != 0) ? finalMaxUses : null,
      per: resetType ? resetType.value : "",
    };
  } else {
    return DEFAULT_USE;
  }
}
