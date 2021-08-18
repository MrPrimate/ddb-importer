import utils from "../../utils.js";
import DICTIONARY from "../../dictionary.js";


export function getItemRarity(data) {
  const rarityDropdown = utils.versionCompare(game.data.system.data.version, "1.4.2") >= 0;
  const rarity = data.definition.rarity
    ? rarityDropdown
      ? data.definition.rarity.toLowerCase()
      : data.definition.rarity
    : "";
  return rarity;
}

/**
 * Checks if the character can attune to an item and if yes, if he is attuned to it.
 */
export function getAttuned(data) {
  if (data.definition.canAttune !== undefined && data.definition.canAttune === true) {
    return data.isAttuned;
  } else {
    return false;
  }
}

/**
 * Checks if the character can equip an item and if yes, if he is has it currently equipped.
 */
export function getEquipped(data) {
  if (data.definition.canEquip !== undefined && data.definition.canEquip === true) {
    return data.equipped;
  } else {
    return false;
  }
}

/**
 * Gets Limited uses information, if any
 * uses: { value: 0, max: 0, per: null }
 */
 export function getUses(data) {
  if (data.limitedUse !== undefined && data.limitedUse !== null) {
    let resetType = DICTIONARY.resets.find((reset) => reset.id == data.limitedUse.resetType);
    return {
      max: data.limitedUse.maxUses,
      value: data.limitedUse.numberUsed
        ? data.limitedUse.maxUses - data.limitedUse.numberUsed
        : data.limitedUse.maxUses,
      per: resetType ? resetType.value : "",
      description: data.limitedUse.resetTypeDescription,
    };
  } else {
    return { value: 0, max: 0, per: null };
  }
}
