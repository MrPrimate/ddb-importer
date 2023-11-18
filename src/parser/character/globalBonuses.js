import DDBHelper from "../../lib/DDBHelper.js";
import DDBCharacter from "../DDBCharacter.js";

/**
 * Gets global bonuses to attacks and damage
 * Supply a list of maps that have the fvtt tyoe and ddb sub type, e,g,
 * { fvttType: "attack", ddbSubType: "magic" }
  {
    "attack": "",
    "damage": "",
  },
 * @param {*} lookupTable
 */
DDBCharacter.prototype.getGlobalBonusAttackModifiers = function(lookupTable) {
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
    const lookupResult = DDBHelper.getModifierSum(DDBHelper.filterBaseModifiers(this.source.ddb, "bonus", { subType: b.ddbSubType }), this.raw.character);
    const lookupMatch = diceFormula.test(lookupResult);

    // if a match then a dice string
    if (lookupMatch || !Number.isInteger(parseInt(lookupResult))) {
      lookupResults[b.fvttType].diceString += lookupResult === "" ? lookupResult : " + " + lookupResult;
    } else {
      lookupResults[b.fvttType].sum += parseInt(lookupResult);
    }
  });

  // loop through outputs from lookups and build a response
  ["attack", "damage"].forEach((fvttType) => {
    if (lookupResults[fvttType].diceString === "") {
      if (lookupResults[fvttType].sum !== 0) {
        result[fvttType] = `${lookupResults[fvttType].sum}`;
      }
    } else {
      result[fvttType] = lookupResults[fvttType].diceString;
      if (lookupResults[fvttType].sum !== 0) {
        result[fvttType] += " + " + lookupResults[fvttType].sum;
      }
    }
  });

  return result;
};

/**
 * Gets global bonuses to spell attacks and damage
 * Most likely from items such as wand of the warmage
 * supply type as 'ranged' or 'melee'
  {
    "attack": "",
    "damage": "",
  },
 * @param {*} type
 */
DDBCharacter.prototype.getBonusSpellAttacks = function(type) {
  // I haven't found any matching global spell damage boosting mods in ddb
  const bonusLookups = [
    { fvttType: "attack", ddbSubType: "spell-attacks" },
    { fvttType: "attack", ddbSubType: `${type}-spell-attacks` },
    { fvttType: "attack", ddbSubType: "warlock-spell-attacks" },
  ];

  return this.getGlobalBonusAttackModifiers(bonusLookups);
};

DDBCharacter.prototype._generateBonusSpellAttacks = function() {
  this.raw.character.system.bonuses.rsak = this.getBonusSpellAttacks("ranged");
  this.raw.character.system.bonuses.msak = this.getBonusSpellAttacks("melee");
};


/**
 * Gets global bonuses to weapon attacks and damage
 * Most likely from items such as wand of the warmage
 * supply type as 'ranged' or 'melee'
  {
    "attack": "",
    "damage": "",
  },
 * @param {*} type
 */
DDBCharacter.prototype.getBonusWeaponAttacks = function(type) {
  // global melee damage is not a ddb type, in that it's likely to be
  // type specific. The only class one I know of is the Paladin Improved Smite
  // which will be handled in the weapon import later.
  const bonusLookups = [
    { fvttType: "attack", ddbSubType: `${type}-attacks` },
    { fvttType: "attack", ddbSubType: "weapon-attacks" },
    { fvttType: "attack", ddbSubType: `${type}-weapon-attacks` },
  ];

  return this.getGlobalBonusAttackModifiers(bonusLookups);
};

DDBCharacter.prototype._generateBonusWeaponAttacks = function() {
  this.raw.character.system.bonuses.mwak = this.getBonusWeaponAttacks("melee");
  this.raw.character.system.bonuses.rwak = this.getBonusWeaponAttacks("ranged");
};

/**
 * Gets global bonuses to ability checks, saves and skills
 * These can come from Paladin auras or items etc
  "abilities": {
    "check": "",
    "save": "",
    "skill": ""
  },
 * @param {*} this.raw.character
 */
DDBCharacter.prototype._generateBonusAbilities = function() {
  let result = {
    "check": "",
    "save": "",
    "skill": "",
  };
  const bonusLookup = [
    { fvttType: "check", ddbSubType: "ability-checks" },
    { fvttType: "save", ddbSubType: "saving-throws" },
    { fvttType: "skill", ddbSubType: "skill-checks" },
  ];

  bonusLookup.forEach((b) => {
    const mods = DDBHelper.filterBaseModifiers(this.source.ddb, "bonus", { subType: b.ddbSubType });
    const bonus = DDBHelper.getModifierSum(mods, this.raw.character);
    if (bonus !== 0 && bonus !== "") result[b.fvttType] = `+ ${bonus}`.trim().replace(/\+\s*\+/, "+");
  });
  this.raw.character.system.bonuses.abilities = result;
};

DDBCharacter.prototype._generateBonusSpellDC = function() {
  let result = {
    "dc": "",
  };
  const bonusLookup = [
    { fvttType: "dc", ddbSubType: "spell-save-dc" },
    { fvttType: "dc", ddbSubType: "warlock-spell-save-dc" },
  ];

  const bonus = bonusLookup.map((b) => {
    return DDBHelper.getModifierSum(DDBHelper.filterBaseModifiers(this.source.ddb, "bonus", { subType: b.ddbSubType }), this.raw.character);
  })
    .filter((b) => b && b !== 0 && String(b).trim() !== "")
    .reduce((previous, current) => {
      return previous !== "" ? [previous, current].join(" + ") : current;
    }, "");

  if (bonus && String(bonus).trim() !== "") {
    result["dc"] = bonus;
  }

  this.raw.character.system.bonuses.spell = result;
};
