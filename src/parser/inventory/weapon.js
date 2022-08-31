import DICTIONARY from "../../dictionary.js";
import utils from "../../utils.js";
import { getItemRarity, getEquipped, getUses, getWeaponProficient, getMagicalBonus, getSingleItemWeight, getQuantity, getDescription } from "./common.js";

/**
 * Gets the DND5E weapontype (simpleM, martialR etc.) as string
 * Supported Types only: Simple/Martial Melee/Ranged and Ammunition (Firearms in D&DBeyond)
 * @param {obj} data item data
 */
function getWeaponType(data) {
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
}

/**
 * Gets the weapons's properties (Finesse, Reach, Heavy etc.)
 * @param {obj} data Item data
 */
function getProperties(data) {
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
}

/**
 * Gets the range(s) of a given weapon
 */
function getRange(data, weaponProperties) {
  // range: { value: null, long: null, units: '' },
  // sometimes reach weapons have their range set as 5. it's not clear why.
  const shortRange = data.definition.range ? data.definition.range : 5;
  const reach = weaponProperties.rch && data.definition.range == 5 ? 5 : 0;
  return {
    value: shortRange + reach,
    long: (data.definition.longRange && data.definition.longRange != data.definition.range)
      ? data.definition.longRange + reach
      : "",
    units: "ft",
  };
};

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
function getAbility(weaponProperties, weaponRange) {
  // finesse weapons can choose freely, so we choose the higher one
  if (weaponProperties.fin) {
    return null;
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
  return null;
}

/**
 * Searches for a magical attack bonus granted by this weapon
 * @param {obj} data item data
 * @param {obj} flags
 */
function getWeaponMagicalBonus(data, flags) {
  const bonus = getMagicalBonus(data);
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
function getDamage(data, flags, betterRolls5e) {
  const magicalDamageBonus = getWeaponMagicalBonus(data, flags);
  // we can safely make these assumptions about GWF and Dueling because the
  // flags are only added for melee attacks
  const greatWeaponFighting = flags.classFeatures.includes("greatWeaponFighting") ? "r<=2" : "";
  const offHand = flags.classFeatures.includes("OffHand");
  const twoWeapon = flags.classFeatures.includes("Two-Weapon Fighting");
  const twoHanded = data.definition.properties.find((property) => property.name === "Two-Handed");
  const melee = data.definition.attackType === 1;
  const dueling = flags.classFeatures.includes("Dueling") && !twoHanded && melee ? " + 2" : "";
  const mod = (offHand && !twoWeapon) ? "" : " + @mod";

  const baseDamageTagData = utils.getDamageTagForItem(data);
  const damageTag = baseDamageTagData.damageTag;
  const damageType = baseDamageTagData.damageType;

  const versatile = data.definition.properties
    .filter((property) => property.name === "Versatile")
    .map((versatile) => {
      if (versatile && versatile.notes) {
        return (
          utils.parseDiceString(versatile.notes + ` + ${magicalDamageBonus}`, null, damageTag, greatWeaponFighting).diceString + mod
        );
      } else {
        return "";
      }
    })[0];

  let parts = [];

  // first damage part
  // blowguns and other weapons rely on ammunition that provides the damage parts
  if (data.definition.damage && data.definition.damage.diceString && damageType) {
    // if we have greatweapon fighting style and this is two handed, add the roll tweak
    // else if we have duelling we add the bonus here (assumption- if you have dueling
    // you're going to use it! (DDB also makes this assumption))
    const fightingStyleDiceMod = twoHanded ? greatWeaponFighting : "";

    // if we are a martial artist and the weapon is eligable we may need to use a bigger dice type.
    // this martial arts die info is addedd to the weapon flags before parse weapon is called
    const martialArtsDie = flags.martialArtsDie;
    let diceString = data.definition.damage.diceString;

    if (martialArtsDie.diceValue && data.definition.damage.diceValue && martialArtsDie.diceValue > data.definition.damage.diceValue) {
      diceString = martialArtsDie.diceString;
    }

    // if there is a magical damage bonus, it probably should only be included into the first damage part.
    parts.push([
      utils.parseDiceString(diceString + ` + ${magicalDamageBonus}`, `${mod}${dueling}`, damageTag, fightingStyleDiceMod)
        .diceString,
      damageType,
    ]);
  }

  // additional damage parts with no restrictions
  data.definition.grantedModifiers
    .filter((mod) => mod.type === "damage" && (!mod.restriction || mod.restriction === ""))
    .forEach((mod) => {
      const die = mod.dice ? mod.dice : mod.die ? mod.die : undefined;
      const damagePart = die ? die.diceString : mod.value;
      if (damagePart) {
        const subDamageTagData = utils.getDamageTagForMod(mod);
        const damageParsed = utils.parseDiceString(damagePart, "", subDamageTagData.damageTag).diceString;
        parts.push([`${damageParsed}`, subDamageTagData.damageType]);
      }
    });


  let chatFlavors = [];
  let otherFormulas = [];
  let restrictions = [];
  const isBetterRolls = game.modules.get("betterrolls5e")?.active;
  // loop over restricted damage types
  // we do this so we can either break this out for midi users
  data.definition.grantedModifiers
    .filter((mod) => mod.type === "damage" && mod.restriction && mod.restriction !== "")
    .forEach((mod) => {
      const die = mod.dice ? mod.dice : mod.die ? mod.die : undefined;
      const damagePart = die ? die.diceString : `${mod.value}`;
      if (damagePart) {
        const subDamageTagData = utils.getDamageTagForMod(mod);
        const damageParsed = utils.parseDiceString(damagePart, "", subDamageTagData.damageTag).diceString;

        restrictions.push(mod.restriction);

        if (isBetterRolls) {
          const attackNum = parts.length;
          betterRolls5e.quickDamage.context[attackNum] = mod.restriction;
          parts.push([`${damageParsed}`, subDamageTagData.damageType]);
        } else {
          otherFormulas.push(damageParsed);
          chatFlavors.push(`[${damagePart}] ${mod.restriction}`);
        }
      }
    });

  const otherFormula = otherFormulas.join(" + ");
  const chatFlavor = isBetterRolls || chatFlavors.length === 0 ? "" : `Roll Other damage: ${chatFlavors.join(", ")}`;

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

  return [result, betterRolls5e, otherFormula, chatFlavor, restrictions];
}

function getActionType(data) {
  if (data.definition.attackType === 1) {
    return "mwak";
  } else {
    return "rwak";
  }
}

export default function parseWeapon(data, character, flags) {
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

  const characterAbilities = character.flags.ddbimporter.dndbeyond.effectAbilities;
  const characterProficiencies = character.flags.ddbimporter.dndbeyond.proficienciesIncludingEffects;

  // if using better rolls lets add some useful QOL information.
  // marks context as magical attack and makes alt click a versatile damage click
  const brFlags = game.modules.get("betterrolls5e")?.active
    ? {
      quickDamage: {
        context: {
          "0": getWeaponMagicalBonus(data, flags) > 0 ? "Magical" : "",
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
          use: false,
          resource: true
        },
        altValue: {
          use: false,
          resource: true
        }
      },
    }
    : {};
  setProperty(weapon, "flags.betterRolls5e", brFlags);

  weapon.system.weaponType = getWeaponType(data);
  weapon.system.properties = getProperties(data);

  const proficientFeatures = ["pactWeapon", "kensaiWeapon"];
  if (flags.classFeatures.some((feat) => proficientFeatures.includes(feat))) {
    weapon.system.proficient = true;
  } else {
    weapon.system.proficient = getWeaponProficient(data, weapon.system.weaponType, characterProficiencies);
  }

  weapon.system.description = getDescription(data);
  weapon.system.source = utils.parseSource(data.definition);
  weapon.system.quantity = getQuantity(data);
  weapon.system.weight = getSingleItemWeight(data);
  weapon.system.equipped = getEquipped(data);
  weapon.system.rarity = getItemRarity(data);
  weapon.system.identified = true;
  weapon.system.activation = { type: "action", cost: 1, condition: "" };
  if (flags.classFeatures.includes("OffHand")) weapon.system.activation.type = "bonus";

  weapon.system.range = getRange(data, weapon.system.properties);
  weapon.system.uses = getUses(data);
  weapon.system.ability = getAbility(weapon.system.properties, weapon.system.range);
  const mockAbility = weapon.system.ability === null
    ? weapon.system.properties.fin ? "dex" : "str"
    : weapon.system.ability;

  // warlocks can use cha for their Hex weapon
  if (flags.classFeatures.includes("hexWarrior")) {
    if (characterAbilities.cha.value >= characterAbilities[mockAbility].value) {
      weapon.system.ability = "cha";
    }
  }
  // kensai monks
  if (flags.classFeatures.includes("kensaiWeapon") || flags.classFeatures.includes("monkWeapon")) {
    if (characterAbilities.dex.value >= characterAbilities[mockAbility].value) {
      weapon.system.ability = "dex";
    }
  }
  if (flags.magicItemAttackInt && (data.definition.magic || weapon.system.properties.mgc)) {
    if (characterAbilities.int.value > characterAbilities[mockAbility].value) {
      weapon.system.ability = "int";
    }
  }

  weapon.system.actionType = getActionType(data);
  weapon.system.attackBonus = getWeaponMagicalBonus(data, flags);

  [
    weapon.system.damage,
    weapon.flags.betterRolls5e,
    weapon.system.formula,
    weapon.system.chatFlavor,
    weapon.flags.ddbimporter.dndbeyond.restrictions,
  ] = getDamage(data, flags, weapon.flags.betterRolls5e);


  return weapon;
}
