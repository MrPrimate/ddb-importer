import utils from "../../utils.js";

/**
 * Gets global bonuses to attacks and damage
 * Supply a list of maps that have the fvtt tyoe and ddb sub type, e,g,
 * { fvttType: "attack", ddbSubType: "magic" }
  {
    "attack": "",
    "damage": "",
  },
 * @param {*} lookupTable
 * @param {*} data
 * @param {*} character
 */
export function getGlobalBonusAttackModifiers(lookupTable, data, character) {
  let result = {
    attack: "",
    damage: "",
  };
  const diceFormula = /\d*d\d*/;

  let lookupResults = {
    attack: {
      sum: 0,
      diceString: "",
    },
    damage: {
      sum: 0,
      diceString: "",
    },
  };

  lookupTable.forEach((b) => {
    const lookupResult = utils.getModifierSum(utils.filterBaseModifiers(data, "bonus", b.ddbSubType), character);
    const lookupMatch = diceFormula.test(lookupResult);

    // if a match then a dice string
    if (lookupMatch) {
      lookupResults[b.fvttType].diceString += lookupResult === "" ? lookupResult : " + " + lookupResult;
    } else {
      lookupResults[b.fvttType].sum += lookupResult;
    }
  });

  // loop through outputs from lookups and build a response
  ["attack", "damage"].forEach((fvttType) => {
    if (lookupResults[fvttType].diceString === "") {
      if (lookupResults[fvttType].sum !== 0) {
        result[fvttType] = lookupResults[fvttType].sum;
      }
    } else {
      result[fvttType] = lookupResults[fvttType].diceString;
      if (lookupResults[fvttType].sum !== 0) {
        result[fvttType] += " + " + lookupResults[fvttType].sum;
      }
    }
  });

  return result;
}

/**
 * Gets global bonuses to spell attacks and damage
 * Most likely from items such as wand of the warmage
 * supply type as 'ranged' or 'melee'
  {
    "attack": "",
    "damage": "",
  },
 * @param {*} data
 * @param {*} character
 * @param {*} type
 */
export function getBonusSpellAttacks(data, character, type) {
  // I haven't found any matching global spell damage boosting mods in ddb
  const bonusLookups = [
    { fvttType: "attack", ddbSubType: "spell-attacks" },
    { fvttType: "attack", ddbSubType: `${type}-spell-attacks` },
    { fvttType: "attack", ddbSubType: "warlock-spell-attacks" },
  ];

  return getGlobalBonusAttackModifiers(bonusLookups, data, character);
}

/**
 * Gets global bonuses to weapon attacks and damage
 * Most likely from items such as wand of the warmage
 * supply type as 'ranged' or 'melee'
  {
    "attack": "",
    "damage": "",
  },
 * @param {*} data
 * @param {*} character
 * @param {*} type
 */
export function getBonusWeaponAttacks(data, character, type) {
  // global melee damage is not a ddb type, in that it's likely to be
  // type specific. The only class one I know of is the Paladin Improved Smite
  // which will be handled in the weapon import later.
  const bonusLookups = [
    { fvttType: "attack", ddbSubType: `${type}-attacks` },
    { fvttType: "attack", ddbSubType: "weapon-attacks" },
    { fvttType: "attack", ddbSubType: `${type}-weapon-attacks` },
  ];

  return getGlobalBonusAttackModifiers(bonusLookups, data, character);
}

/**
 * Gets global bonuses to ability checks, saves and skills
 * These can come from Paladin auras or items etc
  "abilities": {
    "check": "",
    "save": "",
    "skill": ""
  },
 * @param {*} data
 * @param {*} character
 */
export function getBonusAbilities(data, character) {
  let result = {};
  const bonusLookup = [
    { fvttType: "check", ddbSubType: "ability-checks" },
    { fvttType: "save", ddbSubType: "saving-throws" },
    { fvttType: "skill", ddbSubType: "skill-checks" },
  ];

  bonusLookup.forEach((b) => {
    const bonus = utils.getModifierSum(utils.filterBaseModifiers(data, "bonus", b.ddbSubType), character);
    result[b.fvttType] = bonus === 0 ? "" : `${bonus}`;
  });
  return result;
}

export function getBonusSpellDC(data, character) {
  let result = {};
  const bonusLookup = [
    { fvttType: "dc", ddbSubType: "spell-save-dc" },
    { fvttType: "dc", ddbSubType: "warlock-spell-save-dc" },
  ];

  bonusLookup.forEach((b) => {
    result[b.fvttType] = utils.getModifierSum(utils.filterBaseModifiers(data, "bonus", b.ddbSubType), character);
  });

  return result;
}
