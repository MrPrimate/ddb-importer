import DICTIONARY from './dict.js';
import { getAbilityMods } from "./abilities.js";
// import logger from '../logger.js';

export function getAction(text, type = "action") {
  let action = type;
  // const actionAction = text.toLowerCase().match(/as an action/);
  const bonusAction = text.toLowerCase().match(/as a bonus action/);
  const reAction = text.toLowerCase().match(/as a reaction/);
  if (bonusAction) {
    action = "bonus";
  } else if (reAction) {
    action = "reaction";
  }
  return action;
}

export function getRecharge(text) {
  const matches = text.toLowerCase().match(/\(recharge ([0-9–-–−]+)\)/);
  if (matches) {
    const value = matches[1].replace(/–-–−/, "-").split("-").shift();
    return {
      value: parseInt(value),
      charged: true
    };
  }

  return {
    value: null,
    charged: null
  };
}

export function getActivation(text) {
  const matches = text.toLowerCase().match(/\(costs ([0-9]+) actions\)/i);
  if (matches) return parseInt(matches[1]);
  return null;
}

export function getFeatSave(text, save) {
  const saveSearch = "DC (\\d+) (\\w+) saving throw";
  const match = text.match(saveSearch);
  if (match) {
    save.dc = parseInt(match[1]);
    save.ability = match[2].toLowerCase().substr(0, 3);
    save.scaling = "flat";
  }
  return save;
}

export function getReach(text) {
  const reachSearch = "reach\s*(\s*\d+\s*)\s*ft";
  const match = text.match(reachSearch);
  if (match) {
    return match[1];
  }
  return "";
}

export function getRange(text) {
  let range = {
    value: null,
    long: null,
    units: "",
  };

  const rangeSearch1 = "range\s*(\d+)\s*\s*\/\s*(\d+)\s*\s*ft";
  const rangeSearch2 = "range\s*(\d+)\s*ft[.]*\s*\s*\/\s*(\d+)\s*\s*ft";
  const rangeSearch3 = "range\s*(\d+)\s*\s*ft";

  const matches1 = text.match(rangeSearch1);
  const matches2 = text.match(rangeSearch2);
  const matches3 = text.match(rangeSearch3);

  if (matches1) {
    range.value = matches1[1];
    range.long = matches1[2];
    range.units = "ft";
  } else if (matches2) {
    range.value = matches2[1];
    range.long = matches2[2];
    range.units = "ft";
  } else if (matches3) {
    range.value = matches3[1];
    range.units = "ft";
  }
  return range;
}

// export function getDamage(text) {
//   const damageRegEx = `\(\\d+\)*\\s*\\(*\(\\d*d*\\d+\\s*[-+–−]*\\s*\\d*\)\\) \(\\w+\) damage`;
//   const match = text.match(damageRegEx);

//   let damage = {
//     parts: [],
//     versatile: ""
//   };

//   if (match) damage.parts.push([match[2], match[3]]);
//   return damage;
// }


function checkAbility(abilities, mods, proficiencyBonus, target) {
  let result = {
    success: false,
    ability: null,
    proficient: null
  };

  for (const ability of abilities) {
    if (target == proficiencyBonus + mods[ability]) {
      result.success = true;
      result.ability = ability;
      result.proficient = true;
      break;
    } else if (result.toHit == mods[ability]) {
      result.success = true;
      result.ability = ability;
      result.proficient = false;
      break;
    }
  }

  return result;
}

function checkAbilities(abilities, mods, proficiencyBonus, target, negatives = false) {

  const results = abilities.map((ability) => {
    let result = {
      success: false,
      ability: ability,
      proficient: null,
      bonus: 0
    };
    if (target > proficiencyBonus + mods[ability]) {
      result.success = true;
      result.proficient = true;
      result.bonus = target - proficiencyBonus - mods[ability];
    } else if (result.toHit > mods[ability]) {
      result.success = true,
      result.proficient = false;
      result.bonus = target - mods[ability];
    } else if (negatives) {
      result.success = true,
      result.proficient = false;
      result.bonus = target - mods[ability];
    }
    return result;
  });

  return results;
}

function getWeaponAttack(resultData, proficiencyBonus) {
  let result = JSON.parse(JSON.stringify(resultData));
  const abilities = ["str", "dex", "int", "wis", "cha", "con"];
  let weaponAbilities = ["str", "dex"];

  const lookup = DICTIONARY.weapons.find((weapon) => result.name.startsWith(weapon.name));
  // we have a weapon name match so we can infer a bit more
  if (lookup) {
    for (const [key, value] of Object.entries(lookup.properties)) {
      // console.log(`${key}: ${value}`);
      result.properties[key] = value;
    }
    const versatileWeapon = result.properties.ver && result.abilities['dex'] > result.abilities['str'];
    if (versatileWeapon || lookup.actionType == "rwak") {
      weaponAbilities = ["dex"];
    } else if (lookup.actionType == "mwak") {
      weaponAbilities = ["str"];
    }
  }

  if (result.weaponAttack) {
    // check most likely melee attacks - str and dex based
    const checkWeaponAbilities = checkAbility(weaponAbilities, result.abilities, proficiencyBonus, result.toHit);
    if (checkWeaponAbilities.success) {
      result.baseAbility = checkWeaponAbilities.ability;
      result.proficient = checkWeaponAbilities.proficient;
    }

    // okay lets see if its one of the others then!
    if (!result.baseAbility) {
      const checkAllAbilities = checkAbility(abilities, result.abilities, proficiencyBonus, result.toHit);
      if (checkAllAbilities.success) {
        result.baseAbility = checkAllAbilities.ability;
        result.proficient = checkAllAbilities.proficient;
      }
    }

    // okay, some oddity, maybe magic bonus, lets calculate one!
    // we are going to assume it's dex or str based.
    if (!result.baseAbility) {
      const magicAbilities = checkAbilities(weaponAbilities, result.abilities, proficiencyBonus, result.toHit);
      // console.log(magicAbilities);

      const filteredAbilities = magicAbilities.filter((ab) => ab.success == true).sort((a, b) => {
        if (a.proficient == !b.proficient) return -1;
        if (b.proficient == !a.proficient) return 1;
        if (a.proficient == b.proficient) {
          if (a.bonus > b.bonus) return 1;
          if (b.bonus > a.bonus) return -1;
        }
        return 0;
      });

      // fine lets use the first hit
      if (filteredAbilities.length >= 1 && filteredAbilities[0].success) {
        result.baseAbility = filteredAbilities[0].ability;
        result.proficient = filteredAbilities[0].proficient;
        result.extraAttackBonus = filteredAbilities[0].bonus;
      }
    }

    // negative mods!
    if (!result.baseAbility) {
      console.warn("NEGATIVE PARSE!");
      console.warn(result.monsterName);
      console.warn(result.name);
      console.log(result.toHit);

      const magicAbilities = checkAbilities(weaponAbilities, result.abilities, proficiencyBonus, result.toHit, true);
      // console.log(magicAbilities);

      const filteredAbilities = magicAbilities.filter((ab) => ab.success == true).sort((a, b) => {
        if (a.proficient == !b.proficient) return -1;
        if (b.proficient == !a.proficient) return 1;
        if (a.proficient == b.proficient) {
          if (a.bonus < b.bonus) return 1;
          if (b.bonus < a.bonus) return -1;
        }
        return 0;
      });
      console.log(filteredAbilities);
      console.log(result.text);
      let res = [{ success: true, ability: 'str', proficient: true, bonus: 2 }];
      // fine lets use the first hit
      if (filteredAbilities.length >= 1 && filteredAbilities[0].success) {
        result.baseAbility = filteredAbilities[0].ability;
        result.proficient = filteredAbilities[0].proficient;
        result.extraAttackBonus = filteredAbilities[0].bonus;
      } else {
        console.error("Unable to calculate attack!");
        console.log(result.text);
      }
    }
  }

  return result;
}

export function getAttackInfo(monster, DDB_CONFIG, name, text) {
  const matches = text.match(
    /(Melee|Ranged|Melee\s+or\s+Ranged)\s+(|Weapon|Spell)\s*Attack:\s*([+-]\d+)\s+to\s+hit/
  );
  const proficiencyBonus = DDB_CONFIG.challengeRatings.find((cr) => cr.id == monster.challengeRatingId).proficiencyBonus;
  const abilities = getAbilityMods(monster, DDB_CONFIG);


  let result = {
    monsterName: monster.name,
    name: name,
    abilities: abilities,
    weaponAttack: false,
    spellAttack: false,
    meleeAttack: false,
    rangedAttack: false,
    toHit: 0,
    damage: {
      parts: [],
      versatile: ""
    },
    extraAttackBonus: 0,
    baseAbility: null,
    proficient: false,
    properties: {
      "amm": false,
      "fin": false,
      "fir": false,
      "foc": false,
      "hvy": false,
      "lgt": false,
      "lod": false,
      "rch": false,
      "rel": false,
      "ret": false,
      "spc": false,
      "thr": false,
      "two": false,
      "ver": false
    },
    reach: "",
    range: {
      value: null,
      long: null,
      units: "",
    },
    recharge: { value: null, charged: true },
    activation: null,
    save: {
      dc: null,
      ability: null,
      scaling: "flat",
    },
    text: text
  };
  if (matches) {
    result.isAttack = matches[1] !== undefined;
    result.weaponAttack = matches[2] === "Weapon" || matches[2] === "";
    result.spellAttack = matches[2] === "Spell";
    result.meleeAttack = matches[1].indexOf("Melee") !== -1;
    result.rangedAttack = matches[1].indexOf("Ranged") !== -1;
    result.toHit = parseInt(matches[3]);
  }

  const damage = getExtendedDamage(text);
  result.damage = damage.damage;

  if (result.weaponAttack) {
    result = getWeaponAttack(result, proficiencyBonus);
  }
  result.reach = getReach(text);
  result.range = getRange(text);
  result.recharge = getRecharge(text);
  result.activation = getActivation(text);
  result.save = getFeatSave(text, result.save);


  return result;
}


// replaces matchAll, requires a non global regexp
function reMatchAll(regexp, string) {
  const matches = string.match(new RegExp(regexp, "gm"));
  if (matches) {
      let start = 0;
      return matches.map((group0) => {
          const match = group0.match(regexp);
          match.index = string.indexOf(group0, start);
          start = match.index;
          return match;
      });
  }
  return matches;
}


export function getDamage(description) {
  const extendedDamage = getExtendedDamage(description);
  return extendedDamage.damage;
}

/**
 *  This funciton taken from beyond20. Thanks KaKaRoTo!
 */
function getExtendedDamage(description) {
  let result = {
    damage: {
      parts: [],
      versatile: ""
    },
    save: {
      dc: null,
      ability: null
    },
    formula: "",
    preDCDamages: null,
  };

  const hit_idx = description.indexOf("Hit:");
  let hit = description;
  if (hit_idx > 0)
      hit = description.slice(hit_idx);
  // Using match with global modifier then map to regular match because RegExp.matchAll isn't available on every browser
  const damage_regexp = new RegExp(/([\w]* )(?:([0-9]+))?(?: *\(?([0-9]*d[0-9]+(?:\s*[-+]\s*[0-9]+)?(?: plus [^\)]+)?)\)?)? ([\w ]+?) damage(?: when used with | if used with )?(two hands)?/);
  const damage_matches = reMatchAll(damage_regexp, hit) || [];

  // console.log(damage_matches);
  let versatile = false;
  for (let dmg of damage_matches) {
      // Skip any damage that starts wit "DC" because of "DC 13 saving throw or take damage" which could match.
      // A lookbehind would be a simple solution here but rapydscript doesn't let me.
      // Also skip "target reduced to 0 hit points by this damage" from demon-grinder vehicle.
      if (dmg[1] == "DC " || dmg[4] == "hit points by this") {
          continue;
      }
      // check for versatile
      if (dmg[1] == "or " || dmg[5] == "two hands") {
        versatile = true;
      }
      const damage = dmg[3] || dmg[2];
      // Make sure we did match a damage ('  some damage' would match the regexp, but there is no value)
      if (damage) {
          // assumption here is that there is just one field added to versatile. this is going to be rare.
          if (versatile) {
            if (result.damage.versatile == "") result.damage.versatile = damage.replace("plus", "+");
          } else {
            result.damage.parts.push([damage.replace("plus", "+"), dmg[4]]);
          }

      }
  }

  const m = hit.match(/DC ([0-9]+) (.*?) saving throw/);
  result.preDCDamages = result.damage.parts.length;
  if (m) {
      result.save.dc = m[1];
      result.save.ability = m[2].toLowerCase().substr(0, 3);
      result.preDCDamages = damage_matches.reduce((total, match) => {
          if (match.index < m.index)
              total++;
          return total;
      }, 0);
  } else {
      const m2 = hit.match(/escape DC ([0-9]+)/);
      if (m2) {
        result.save.dc = m2[1];
        result.save.ability = "Escape";
      }
  }

  return result;
}
