import DDBHelper from "../../lib/DDBHelper.js";
import DDBCharacter from "../DDBCharacter.js";


/**
 * Given a list of lookup tables, e.g. { fvttType: "attack", ddbSubType: "magic" }
 * returns an object with attack and damage properties that contain a string
 * that can be used to set the global bonus to hit and damage.
 * The string is either a dice string, e.g. "d6 + 2"
 * or an integer, e.g. "2"
 * @param {Array} lookupTable list of lookup tables
 * @returns {object} { attack: string, damage: string }
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
 * Retrieves global bonuses to spell attacks, potentially derived from items
 * like a wand of the warmage. This function focuses on attack bonuses, as
 * there are no corresponding global spell damage boosting modifiers found in
 * DDB.
 *
 * @param {string} type The type of spell attack, either 'ranged' or 'melee'.
 * @returns {object} An object containing the calculated global bonus for spell attacks.
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
 * Retrieves global bonuses to weapon attacks, potentially derived from items
 * like a wand of the warmage.
 *
 * @param {string} type The type of attack, either 'ranged' or 'melee'.
 * @returns {object} An object containing the calculated global bonus for the given attack type.
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
 * Calculates global bonuses to ability checks, saves and skills, which can
 * come from items, spells, or other sources. These bonuses are applied to
 * all ability checks, saves and skills.
 *
 * Modifiers are sourced from the "bonus" type of modifiers in the character's
 * source data.
 *
 * The resulting bonuses are stored in the character's data in the
 * "system.bonuses.abilities" property.
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


/**
 * Calculates global bonuses to spell DCs, which can come from items, spells or other sources.
 * These bonuses are applied to all spell DCs.
 *
 * Modifiers are sourced from the "bonus" type of modifiers in the character's source data.
 *
 * The resulting bonuses are stored in the character's data in the
 * "system.bonuses.spell.dc" property.
 */
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
