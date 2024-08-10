import DICTIONARY from "../../dictionary.js";

const DEFAULT_USE = {
  spent: null,
  max: null,
  recovery: [],
};

/**
 * Get the reset condition of the spell, if uses restricted
 * @param {*} data Spell data
 * @param {*} character Character data
 */
// eslint-disable-next-line no-unused-vars
export function getUses(data, character) {
  // we check this, as things like items have useage attached to the item, not spell
  const limitedUse = foundry.utils.getProperty(data, "flags.ddbimporter.dndbeyond.limitedUse") ?? data.limitedUse;

  if (!limitedUse) return DEFAULT_USE;
  const resetType = DICTIONARY.resets.find((reset) => reset.id == limitedUse.resetType);
  if (!resetType) return DEFAULT_USE;

  if (limitedUse.maxUses || limitedUse.statModifierUsesId || limitedUse.useProficiencyBonus) {
    let maxUses = (limitedUse.maxUses && limitedUse.maxUses !== -1) ? limitedUse.maxUses : "";

    if (limitedUse.statModifierUsesId) {
      const ability = DICTIONARY.character.abilities.find(
        (ability) => ability.id === limitedUse.statModifierUsesId,
      ).value;

      switch (limitedUse.operator) {
        case 2: {
          // maxUses *= character.flags.ddbimporter.dndbeyond.effectAbilities[ability].mod;
          maxUses = `${maxUses} * @abilities.${ability}.mod`;
          break;
        }
        case 1:
        default:
          // maxUses += character.flags.ddbimporter.dndbeyond.effectAbilities[ability].mod;
          maxUses = `${maxUses} + @abilities.${ability}.mod`;
      }
    }

    if (limitedUse.useProficiencyBonus) {
      switch (limitedUse.proficiencyBonusOperator) {
        case 2: {
          // maxUses *= character.system.attributes.prof;
          maxUses = `${maxUses} * @prof`;
          break;
        }
        case 1:
        default:
          // maxUses += character.system.attributes.prof;
          maxUses = `${maxUses} + @prof`;
      }
    }

    const finalMaxUses = (maxUses !== "") ? maxUses : null;

    return {
      spent: limitedUse.numberUsed ?? null,
      max: finalMaxUses,
      recovery: resetType
        ? [{
          // TODO: if charges returned here maybe don't?
          period: resetType.value,
          type: 'recoverAll',
        }]
        : [],
    };
  } else {
    return DEFAULT_USE;
  }
}
