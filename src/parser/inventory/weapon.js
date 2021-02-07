import DICTIONARY from "../../dictionary.js";
import utils from "../../utils.js";

/**
 * Gets the DND5E weapontype (simpleM, martialR etc.) as string
 * Supported Types only: Simple/Martial Melee/Ranged and Ammunition (Firearms in D&DBeyond)
 * @param {obj} data item data
 */
let getWeaponType = (data) => {
  const type = DICTIONARY.weapon.weaponType.find(
    (type) => type.categoryId === data.definition.categoryId
  );
  const range = DICTIONARY.weapon.weaponRange.find(
    (type) => type.attackType === data.definition.attackType
  );

  if (type && range) {
    return `${type.value}${range.value}`;
  } else {
    return "simpleM";
  }
};

/**
 * Gets the weapons's properties (Finesse, Reach, Heavy etc.)
 * @param {obj} data Item data
 */
let getProperties = (data) => {
  let result = {};
  DICTIONARY.weapon.properties.forEach((property) => {
    if (data.definition.properties && Array.isArray(data.definition.properties)) {
      result[property.value] = data.definition.properties.some((prop) => prop.name === property.name);
    }
    if (
      !result[property.value] &&
      data.definition.grantedModifiers &&
      Array.isArray(data.definition.grantedModifiers)
    ) {
      result[property.value] = data.definition.grantedModifiers.some(
        (prop) => prop.type === "weapon-property" && prop.friendlySubtypeName === property.name
      );
    }
  });
  return result;
};

/**
 * Checks the proficiency of the character with this specific weapon
 * @param {obj} data Item data
 * @param {string} weaponType The DND5E weaponType
 * @param {array} proficiencies The character's proficiencies as an array of `{ name: 'PROFICIENCYNAME' }` objects
 */
let getProficient = (data, weaponType, proficiencies) => {
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
    return proficiencies.find((proficiency) => proficiency.name === data.definition.type) !== undefined;
  }
};

/**
 * Checks if the character can attune to an item and if yes, if he is attuned to it.
 */
let getAttuned = (data) => {
  if (data.definition.canAttune !== undefined && data.definition.canAttune === true) {
    return data.isAttuned;
  } else {
    return false;
  }
};

/**
 * Checks if the character can equip an item and if yes, if he is has it currently equipped.
 */
let getEquipped = (data) => {
  if (data.definition.canEquip !== undefined && data.definition.canEquip === true) {
    return data.equipped;
  } else {
    return false;
  }
};

/**
 * Gets the range(s) of a given weapon
 */
let getRange = (data) => {
  // range: { value: null, long: null, units: '' },
  return {
    value: data.definition.range ? data.definition.range : 5,
    long: data.definition.longRange ? data.definition.longRange : 5,
    units: "ft.",
  };
};

/**
 * Gets Limited uses information, if any
 * uses: { value: 0, max: 0, per: null }
 */
// let getUses = (data) => {
//   if (data.limitedUse !== undefined && data.limitedUse !== null) {
//     let resetType = DICTIONARY.resets.find((reset) => reset.id == data.limitedUse.resetType);
//     return {
//       max: data.limitedUse.maxUses,
//       value: data.limitedUse.numberUsed
//         ? data.limitedUse.maxUses - data.limitedUse.numberUsed
//         : data.limitedUse.maxUses,
//       per: resetType.value,
//       description: data.limitedUse.resetTypeDescription,
//     };
//   } else {
//     return { value: 0, max: 0, per: null };
//   }
// };

/**
 * Gets the ability which the to hit modifier is baed on
 * Melee: STR
 * Ranged: DEX
 * Finesse: STR || DEX
 * Thrown: STR, unless Finesse, then STR || DEX
 * @param {obj} data item data
 * @param {obj} weaponProperties weapon properties
 * @param {obj} weaponRange weapon range information
 * @param {obj} abilities character abilities (scores)
 */
let getAbility = (weaponProperties, weaponRange, abilities) => {
  // finesse weapons can choose freely, so we choose the higher one
  if (weaponProperties.fin) {
    return abilities.str.value > abilities.dex.value ? "str" : "dex";
  }

  // thrown, but not finesse weapon: STR
  if (weaponProperties.thr) {
    return "str";
  }

  // if it's a ranged weapon, and not a reach weapon (long = 10 (?))
  if (weaponRange.long > 5 && !weaponProperties.rch) {
    return "dex";
  }
  // the default is STR
  return "str";
};

/**
 * Searches for a magical attack bonus granted by this weapon
 * @param {obj} data item data
 * @param {obj} flags
 */
let getMagicalBonus = (data, flags) => {
  const boni = data.definition.grantedModifiers.filter(
    (mod) => mod.type === "bonus" && mod.subType === "magic" && mod.value && mod.value !== 0
  );
  const bonus = boni.reduce((prev, cur) => prev + cur.value, 0);
  if (flags.classFeatures.includes("Improved Pact Weapon") && bonus === 0) {
    return 1;
  } else {
    return bonus;
  }
};

/**
 *
 * @param {obj} data item data
 * @param {obj} flags
 * /* damage: { parts: [], versatile: '' }, * /
 */
let getDamage = (data, flags, betterRolls5e) => {
  const magicalDamageBonus = getMagicalBonus(data, flags);
  // we can safely make these assumptions about GWF and Dueling because the
  // flags are only added for melee attacks
  const greatWeaponFighting = flags.classFeatures.includes("greatWeaponFighting") ? "r<=2" : "";
  const dueling = flags.classFeatures.includes("Dueling") ? " + 2" : "";
  const offHand = flags.classFeatures.includes("OffHand");
  const twoWeapon = flags.classFeatures.includes("Two-Weapon Fighting");
  const mod = (offHand && !twoWeapon) ? "" : " + @mod";
  const versatile = data.definition.properties
    .filter((property) => property.name === "Versatile")
    .map((versatile) => {
      if (versatile && versatile.notes) {
        return (
          utils.parseDiceString(versatile.notes + `+ ${magicalDamageBonus}`, greatWeaponFighting).diceString + mod
        );
      } else {
        return "";
      }
    })[0];
  const twoHanded = data.definition.properties.find((property) => property.name === "Two-Handed");

  let parts = [];

  // first damage part
  // blowguns and other weapons rely on ammunition that provides the damage parts
  if (data.definition.damage && data.definition.damage.diceString && data.definition.damageType) {
    // if we have greatweapon fighting style and this is two handed, add the roll tweak
    // else if we have duelling we add the bonus here (assumption- if you have dueling
    // you're going to use it! (DDB also makes this assumption))
    const fightingStyleMod = twoHanded ? greatWeaponFighting : dueling;

    // if we are a martial artist and the weapon is eligable we may need to use a bigger dice type.
    // this martial arts die info is addedd to the weapon flags before parse weapon is called
    const martialArtsDie = flags.martialArtsDie;
    let diceString = data.definition.damage.diceString;

    if (martialArtsDie.diceValue && data.definition.damage.diceValue && martialArtsDie.diceValue > data.definition.damage.diceValue) {
      diceString = martialArtsDie.diceString;
    }

    // if there is a magical damage bonus, it probably should only be included into the first damage part.
    parts.push([
      utils.parseDiceString(diceString + `+ ${magicalDamageBonus}`, fightingStyleMod)
        .diceString + mod,
      data.definition.damageType.toLowerCase(),
    ]);
  }

  // additional damage parts
  // Note: For the time being, restricted additional bonus parts are not included in the damage
  data.definition.grantedModifiers
    .filter((mod) => mod.type === "damage"
      // && (!mod.restriction || (!!mod.restriction && mod.restriction === ""))
    )
    .forEach((mod) => {
      const attackNum = parts.length;
      const restriction = (mod.restriction) ? mod.restriction : "";
      betterRolls5e.quickDamage.context[attackNum] = restriction;

      if (mod.dice) {
        parts.push([mod.dice.diceString, mod.subType]);
      } else if (mod.value) {
        parts.push([mod.value, mod.subType]);
      }
    });

  // add damage modifiers from other sources like improved divine smite
  if (flags.damage.parts) {
    flags.damage.parts.forEach((part) => {
      parts.push(part);
    });
  }

  const result = {
    parts: parts,
    versatile: versatile,
  };

  return [result, betterRolls5e];
};

let getActionType = (data) => {
  if (data.definition.attackType === 1) {
    return "mwak";
  } else {
    return "rwak";
  }
};

export default function parseWeapon(data, character, flags) {
  /**
   * MAIN parseWeapon
   */
  let weapon = {
    name: data.definition.name,
    type: "weapon",
    data: JSON.parse(utils.getTemplate("weapon")),
    flags: {
      ddbimporter: {
        dndbeyond: {
          type: data.definition.type,
          damage: flags.damage,
          classFeatures: flags.classFeatures,
        },
      },
    },
  };

    // if using better rolls lets add some useful QOL information.
  // marks context as magical attack and makes alt click a versatile damage click
  weapon.flags.betterRolls5e = {
    quickDamage: {
      context: {
        "0": getMagicalBonus(data, flags) > 0 ? "Magical" : "",
      },
      value: {
        "0": true,
      },
      altValue: {
        "0": true,
      },
    },
    quickVersatile: {
      altValue: true,
    },
    quickCharges: {
      value: {
        use: true,
        resource: true
      },
      altValue: {
        use: true,
        resource: true
      }
    },
  };

  /* weaponType: { value: 'simpleM' }, */
  // NOTE: In game, it's `weaponType: 'simpleM'`, checking with Andrew is that is intended (I suppose so, but then the template.json is incorrect)
  weapon.data.weaponType = getWeaponType(data);
  // properties: {
  //        amm: false,
  //        fin: false,
  //        hvy: true,
  //        lgt: false,
  //        rel: false,
  //        fir: false,
  //        rch: true,
  //        spc: false,
  //        thr: false,
  //        two: true,
  //        ver: false
  //    }
  weapon.data.properties = getProperties(data);

  /* proficient: true, */
  const proficientFeatures = ["pactWeapon", "kensaiWeapon"];
  if (flags.classFeatures.some((feat) => proficientFeatures.includes(feat))) {
    weapon.data.proficient = true;
  } else {
    weapon.data.proficient = getProficient(data, weapon.data.weaponType, character.flags.ddbimporter.dndbeyond.proficiencies);
  }

  // description: {
  //        value: '',
  //        chat: '',
  //        unidentified: ''
  //    },
  weapon.data.description = {
    value: data.definition.description,
    chat: data.definition.description,
    unidentified: data.definition.type,
  };

  /* source: '', */
  weapon.data.source = utils.parseSource(data.definition);

  /* quantity: 1, */
  weapon.data.quantity = data.quantity ? data.quantity : 1;

  /* weight */
  const bundleSize = data.definition.bundleSize ? data.definition.bundleSize : 1;
  const totalWeight = data.definition.weight ? data.definition.weight : 0;

  weapon.data.weight = totalWeight / bundleSize;

  /* price */
  weapon.data.price = data.definition.cost ? data.definition.cost : 0;

  /* attuned: false, */
  weapon.data.attuned = getAttuned(data);

  /* equipped: false, */
  weapon.data.equipped = getEquipped(data);

  /* rarity: '', */
  weapon.data.rarity = data.definition.rarity;

  /* identified: true, */
  weapon.data.identified = true;

  /* activation: { type: '', cost: 0, condition: '' }, */
  weapon.data.activation = { type: "action", cost: 1, condition: "" };
  if (flags.classFeatures.includes("OffHand")) weapon.data.activation.type = "bonus";

  /* duration: { value: null, units: '' }, */
  // we leave that as-is

  /* target: { value: null, units: '', type: '' }, */
  // we leave that as-is

  /* range: { value: null, long: null, units: '' }, */
  weapon.data.range = getRange(data);

  // we don't parse this because the weapon then becomes a limited use item.
  // this field is normally reserved on weapons for magic effects. so we handle it there.
  /* uses: { value: 0, max: 0, per: null }, */
  // weapon.data.uses = getUses(data);

  /* ability: null, */
  weapon.data.ability = getAbility(weapon.data.properties, weapon.data.range, character.data.abilities);
  // warlocks can use cha for their Hex weapon
  if (flags.classFeatures.includes("hexWarrior")) {
    if (character.data.abilities.cha.value >= character.data.abilities[weapon.data.ability].value) {
      weapon.data.ability = "cha";
    }
  }
  // kensai monks
  if (flags.classFeatures.includes("kensaiWeapon") || flags.classFeatures.includes("monkWeapon")) {
    if (character.data.abilities.dex.value >= character.data.abilities[weapon.data.ability].value) {
      weapon.data.ability = "dex";
    }
  }

  /* actionType: null, */
  weapon.data.actionType = getActionType(data);

  /* attackBonus: 0, */
  weapon.data.attackBonus = getMagicalBonus(data, flags);

  /* chatFlavor: '', */
  // we leave that as-is

  /* critical: null, */
  // we leave that as-is

  /* damage: { parts: [], versatile: '' }, */
  [weapon.data.damage, weapon.flags.betterRolls5e] = getDamage(data, flags, weapon.flags.betterRolls5e);

  /* formula: '', */
  // we leave that as-is

  /* save: { ability: '', dc: null } */
  // we leave that as-is
  return weapon;
}
