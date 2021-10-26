import utils from "../../utils.js";
import DICTIONARY from "../../dictionary.js";


export function getItemRarity(data) {
  const rarityDropdown = utils.versionCompare(game.data.system.data.version, "1.4.2") >= 0;
  let tmpRarity = data.definition.rarity;
  const rarity = data.definition.rarity
    ? rarityDropdown
      ? tmpRarity.charAt(0).toLowerCase() + tmpRarity.slice(1).replace(/\s/g, "")
      : tmpRarity
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

export function getConsumableUses(data) {
  if (data.limitedUse) {
    let uses = getUses(data);
    if (uses.per === "") uses.per = "charges";
    uses.autoUse = false;
    uses.autoDestroy = true;
    return uses;
  } else {
    // default
    return { value: 1, max: 1, per: "charges", autoUse: false, autoDestroy: true };
  }
}

/**
 * Checks the proficiency of the character with this specific weapon
 * @param {obj} data Item data
 * @param {string} weaponType The DND5E weaponType
 * @param {array} proficiencies The character's proficiencies as an array of `{ name: 'PROFICIENCYNAME' }` objects
 */
export function getWeaponProficient(data, weaponType, proficiencies) {
  // if it's a simple weapon and the character is proficient in simple weapons:
  if (
    proficiencies.find((proficiency) => proficiency.name === "Simple Weapons") &&
    weaponType.indexOf("simple") !== -1
  ) {
    return true;
  } else if (
    proficiencies.find((proficiency) => proficiency.name === "Martial Weapons") &&
    weaponType.indexOf("martial") !== -1
  ) {
    return true;
  } else {
    const proficient = proficiencies.some((proficiency) => proficiency.name.toLowerCase() === data.definition.type.toLowerCase());
    return proficient;
  }
};

/**
 * Searches for a magical attack bonus granted by this weapon
 * @param {obj} data item data
 */
export function getMagicalBonus(data) {
  let boni = data.definition.grantedModifiers.filter(
    (mod) => mod.type === "bonus" && mod.subType === "magic" && mod.value && mod.value !== 0
  );
  let bonus = boni.reduce((prev, cur) => prev + cur.value, 0);
  return bonus;
}

export function getAttunement(item) {
  if (item.isAttuned) {
    return 2;
  } else if (item.definition.canAttune) {
    return 1;
  } else {
    return 0;
  }
}

export function getBaseItem(data) {
  let baseItem = "";

  if (data.definition.filterType === "Weapon") {
    baseItem = data.definition.type.toLowerCase().split(",").reverse().join("").replace(/\s/g, "");
  } else if (data.definition.filterType === "Armor" && data.definition.baseArmorName) {
    baseItem = data.definition.baseArmorName.toLowerCase().split(",").reverse().join("").replace(/\s/g, "");
  } else if (data.definition.filterType === "Other Gear" &&
    ((data.definition.gearTypeId === 1 && data.definition.subType === "Tool") ||
      (data.definition.gearTypeId === 11))) {
    const toolProficiencies = DICTIONARY.character.proficiencies
      .filter((prof) => prof.type === "Tool")
      .map((prof) => {
        return prof;
      });

    const baseTool = toolProficiencies.find((allProf) => allProf.name === data.definition.name);
    if (baseTool && baseTool.baseTool && baseTool.baseTool !== "") {
      baseItem = baseTool.baseTool;
    }
  }


  return baseItem;
}

export function getQuantity(data) {
  return data.definition.quantity
    ? data.definition.quantity
    : data.quantity
      ? data.quantity
      : 1;
}

export function getSingleItemWeight(data) {
  const bundleSize = data.definition?.bundleSize ? data.definition.bundleSize : 1;
  const totalWeight = data.definition?.weight ? data.definition.weight : 0;
  const weight = totalWeight / bundleSize;
  return weight;
}
