import DICTIONARY from './dict.js';
import { getAbilityMods } from "./abilities.js";
import logger from '../../logger.js';

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
  };

  const hitIndex = description.indexOf("Hit:");
  let hit = description;
  if (hitIndex > 0) hit = description.slice(hitIndex);
  // Using match with global modifier then map to regular match because RegExp.matchAll isn't available on every browser
  const damamgeExpression = new RegExp(/([\w]* )(?:([0-9]+))?(?: *\(?([0-9]*d[0-9]+(?:\s*[-+]\s*[0-9]+)?(?: plus [^\)]+)?)\)?)? ([\w ]*?)\s*damage(?: when used with | if used with )?(two hands)?/); // eslint-disable-line no-useless-escape
  const matches = reMatchAll(damamgeExpression, hit) || [];
  const regainExpression = new RegExp(/(regains)\s+?(?:([0-9]+))?(?: *\(?([0-9]*d[0-9]+(?:\s*[-+]\s*[0-9]+)??)\)?)?\s+hit\s+points/);
  const regainMatch = hit.match(regainExpression);

  // logger.info(matches);

  for (let dmg of matches) {
    let versatile = false;
    if (dmg[1] == "DC " || dmg[4] == "hit points by this") {
        continue; // eslint-disable-line no-continue
    }
    // check for versatile
    if (dmg[1] == "or " || dmg[5] == "two hands") {
      versatile = true;
    }
    const damage = dmg[3] || dmg[2];
    // Make sure we did match a damage
    if (damage) {
      // assumption here is that there is just one field added to versatile. this is going to be rare.
      if (versatile) {
        if (result.damage.versatile == "") result.damage.versatile = damage.replace("plus", "+");
      } else {
        result.damage.parts.push([damage.replace("plus", "+"), dmg[4]]);
      }
    }
  }

  if (regainMatch) {
    result.damage.parts.push([regainMatch[3], 'healing']);
  }

  const save = hit.match(/DC ([0-9]+) (.*?) saving throw/);
  if (save) {
      result.save.dc = save[1];
      result.save.ability = save[2].toLowerCase().substr(0, 3);
  } else {
      const escape = hit.match(/escape DC ([0-9]+)/);
      if (escape) {
        result.save.dc = escape[1];
        result.save.ability = "Escape";
      }
  }

  return result;
}

export function getDamage(description) {
  const extendedDamage = getExtendedDamage(description);
  return extendedDamage.damage;
}

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

export function getUses(text) {
  let uses = {
    value: 0,
    max: 0,
    per: null,
  };

  const usesSearch = /\((\d+)\/(\w+)\)/;
  const usesMatch = text.match(usesSearch);
  // console.log(usesMatch);
  if (usesMatch && usesMatch[2].toLowerCase() !== "turn") {
    uses.value = usesMatch[1];
    uses.max = usesMatch[1];
    uses.per = "day";
    const perMatch = DICTIONARY.resets.find((reset) => reset.id === usesMatch[2]);
    if (perMatch) uses.per = perMatch.value;
  }

  return uses;
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
  const saveSearch = /DC (\d+) (\w+) saving throw/;
  const match = text.match(saveSearch);
  if (match) {
    save.dc = parseInt(match[1]);
    save.ability = match[2].toLowerCase().substr(0, 3);
    save.scaling = "flat";
  }
  return save;
}

export function getReach(text) {
  const reachSearch = /reach\s*(\s*\d+\s*)\s*ft/;
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

  const rangeSearch1 = /range\s*(\d+)\s*\s*\/\s*(\d+)\s*\s*ft/;
  const rangeSearch2 = /range\s*(\d+)\s*ft[.]*\s*\s*\/\s*(\d+)\s*\s*ft/;
  const rangeSearch3 = /range\s*(\d+)\s*\s*ft/;
  const reachSearch = /reach\s*(\d+)\s*\s*ft/;

  const matches1 = text.match(rangeSearch1);
  const matches2 = text.match(rangeSearch2);
  const matches3 = text.match(rangeSearch3);
  const reachMatch = text.match(reachSearch);

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
  } else if (reachMatch) {
    range.value = reachMatch[1];
    range.units = "ft";
  }

  return range;
}

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
      result.success = true;
      result.proficient = false;
      result.bonus = target - mods[ability];
    } else if (negatives) {
      result.success = true;
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
  let initialAbilities = [];
  let weaponAbilities = ["str", "dex"];
  let spellAbilities = ["cha", "wis", "int"];

  const lookup = DICTIONARY.weapons.find((weapon) => result.name.startsWith(weapon.name));
  // we have a weapon name match so we can infer a bit more
  if (lookup) {
    for (const [key, value] of Object.entries(lookup.properties)) {
      // logger.info(`${key}: ${value}`);
      result.properties[key] = value;
    }
    const versatileWeapon = result.properties.ver && result.abilities['dex'] > result.abilities['str'];
    if (versatileWeapon || lookup.actionType == "rwak") {
      weaponAbilities = ["dex"];
    } else if (lookup.actionType == "mwak") {
      weaponAbilities = ["str"];
    }
    result.weaponType = lookup.weaponType;
  }

  if (result.spellAttack) {
    initialAbilities = spellAbilities;
  } else if (result.weaponAttack) {
    initialAbilities = weaponAbilities;
  } else {
    initialAbilities = abilities;
  }

  if (result.weaponAttack || result.spellAttack) {
    // check most likely initial attacks - str and dex based weapon, mental for spell
    const checkInitialAbilities = checkAbility(initialAbilities, result.abilities, proficiencyBonus, result.toHit);
    if (checkInitialAbilities.success) {
      result.baseAbility = checkInitialAbilities.ability;
      result.proficient = checkInitialAbilities.proficient;
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
      const magicAbilities = checkAbilities(initialAbilities, result.abilities, proficiencyBonus, result.toHit);
      // logger.info(magicAbilities);

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
      logger.warn("NEGATIVE PARSE!");
      logger.warn(result.monsterName);
      logger.warn(result.name);
      logger.info(result.toHit);

      const magicAbilities = checkAbilities(initialAbilities, result.abilities, proficiencyBonus, result.toHit, true);
      // logger.info(magicAbilities);

      const filteredAbilities = magicAbilities.filter((ab) => ab.success == true).sort((a, b) => {
        if (a.proficient == !b.proficient) return -1;
        if (b.proficient == !a.proficient) return 1;
        if (a.proficient == b.proficient) {
          if (a.bonus < b.bonus) return 1;
          if (b.bonus < a.bonus) return -1;
        }
        return 0;
      });
      logger.debug(filteredAbilities);
      logger.debug(result.text);
      // fine lets use the first hit
      if (filteredAbilities.length >= 1 && filteredAbilities[0].success) {
        result.baseAbility = filteredAbilities[0].ability;
        result.proficient = filteredAbilities[0].proficient;
        result.extraAttackBonus = filteredAbilities[0].bonus;
      } else {
        logger.error("Unable to calculate attack!");
        logger.info(result.text);
      }
    }
  }

  return result;
}

export function getTarget(text) {
  let target = {
    "value": null,
    "width": null,
    "units": "",
    "type": ""
  };

  // 90-foot line that is 10 feet wide
  // in a 90-foot cone
  const coneSearch = /(\d+)-foot line/;
  const lineSearch = /(\d+)-foot cone/;

  const coneMatch = text.match(coneSearch);
  const lineMatch = text.match(lineSearch);

  if (coneMatch) {
    target.value = coneMatch[1];
    target.units = "ft";
    target.type = "cone";
  } else if (lineMatch) {
    target.value = lineMatch[1];
    target.units = "ft";
    target.type = "line";
  }

  return target;
}

export function getActionInfo(monster, DDB_CONFIG, name, text) {
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
    weaponType: null,
    toHit: 0,
    damage: {
      parts: [],
      versatile: ""
    },
    target: {
      "value": null,
      "width": null,
      "units": "",
      "type": ""
    },
    duration: {
      "value": null,
      "units": "inst"
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
    text: text,
    uses: {
      value: 0,
      max: 0,
      per: null,
    },
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

  if (result.weaponAttack || result.spellAttack) {
    result = getWeaponAttack(result, proficiencyBonus);
  }
  result.reach = getReach(text);
  result.range = getRange(text);
  if (result.range.value > 5) result.properties.rch = true;
  result.recharge = getRecharge(text);
  result.activation = getActivation(text);
  result.save = getFeatSave(text, result.save);
  result.target = getTarget(text);
  result.uses = getUses(text);

  return result;
}

