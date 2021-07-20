import DICTIONARY from "../../dictionary.js";

/**
 * Get the reset condition of the spell, if uses restricted
 * @param {*} data Spell data
 */
export function getUses(data) {
  let resetType = null;
  let limitedUse = null;
  // we check this, as things like items have useage attached to the item, not spell
  if (data.flags.ddbimporter.dndbeyond.limitedUse !== undefined && data.flags.ddbimporter.dndbeyond.limitedUse !== null) {
    limitedUse = data.flags.ddbimporter.dndbeyond.limitedUse;
    resetType = DICTIONARY.resets.find((reset) => reset.id == limitedUse.resetType);
  } else if (data.limitedUse !== undefined && data.limitedUse !== null) {
    limitedUse = data.limitedUse;
    resetType = DICTIONARY.resets.find((reset) => reset.id == limitedUse.resetType);
  }

  if (resetType !== null && resetType !== undefined) {
    return {
      value: limitedUse.numberUsed ? limitedUse.maxUses - limitedUse.numberUsed : parseInt(limitedUse.maxUses),
      max: parseInt(limitedUse.maxUses),
      per: resetType.value,
    };
  } else {
    return {};
  }
}
