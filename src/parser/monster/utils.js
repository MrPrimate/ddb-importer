import { getAbilityMods } from "./helpers.js";
import logger from '../../logger.js';
import utils from '../../lib/utils.js';
import DICTIONARY from '../../dictionary.js';

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

// some monsters now have [rollable] tags - if these exist we need to parse them out
// in the future we may be able to use them, but not consistent yet
export function replaceRollable(text) {
  const rollableRegex = new RegExp(/(\[rollable\])([^;]*);(.*)(\[\/rollable\])/);
  const rollableMatches = reMatchAll(rollableRegex, text) || [];
  for (let match of rollableMatches) {
    if (match[2]) {
      text = text.replace(match[0], match[2]);
    }
  }
  return text;
}

function damageModReplace(text, attackInfo, damageType) {
  let result;
  const globalDamageHints = game.settings.get("ddb-importer", "use-damage-hints");
  const damageHint = globalDamageHints && damageType ? `[${damageType}]` : "";
  const diceParse = utils.parseDiceString(text, null, damageHint);
  if (attackInfo.baseAbility) {
    const baseAbilityMod = attackInfo.abilities[attackInfo.baseAbility];
    const bonusMod = (diceParse.bonus && diceParse.bonus !== 0) ? diceParse.bonus - baseAbilityMod : "";
    const useMod = (diceParse.bonus && diceParse.bonus !== 0) ? " + @mod " : "";
    const reParse = utils.diceStringResultBuild(diceParse.diceMap, diceParse.dice, bonusMod, useMod, damageHint);
    result = reParse.diceString;
  } else {
    result = diceParse.diceString;
  }

  return result;
}

// eslint-disable-next-line complexity
function getExtendedDamage(description, attackInfo) {
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
  };

  const hitIndex = description.indexOf("Hit:");
  let hit = description;
  if (hitIndex > 0) hit = description.slice(hitIndex);
  hit = hit.split("At the end of each")[0].split("At the start of each")[0];
  hit = hit.replace(/[–-–−]/g, "-");
  // console.warn(hit);
  // Using match with global modifier then map to regular match because RegExp.matchAll isn't available on every browser
  // eslint-disable-next-line no-useless-escape
  const damageExpression = new RegExp(/((?:saving throw or take\s+)|(?:[\w]*\s+))(?:([0-9]+))?(?:\s*\(?([0-9]*d[0-9]+(?:\s*[-+]\s*[0-9]+)?(?:\s+plus [^\)]+)?)\)?)?\s*([\w ]*?)\s*damage(?: when used with | if used with )?(\s?two hands|\s?at the start of|\son a failed save)?/);
  const matches = reMatchAll(damageExpression, hit) || [];
  const regainExpression = new RegExp(/(regains)\s+?(?:([0-9]+))?(?: *\(?([0-9]*d[0-9]+(?:\s*[-+]\s*[0-9]+)??)\)?)?\s+hit\s+points/);
  const regainMatch = hit.match(regainExpression);

  logger.debug("Damage matches: ", matches);
  let versatile = false;
  for (let dmg of matches) {
    let other = false;
    if (dmg[1] == "DC " || dmg[4] == "hit points by this") {
      continue; // eslint-disable-line no-continue
    }
    // check for versatile
    if (dmg[1] == "or " || dmg[5] == "two hands") {
      versatile = true;
    }
    // check for other
    if (dmg[5] && dmg[5].trim() == "at the start of") other = true;
    const damage = dmg[3] || dmg[2];
    // Make sure we did match a damage
    if (damage) {
      const includesDiceRegExp = /[0-9]*d[0-9]+/;
      const includesDice = includesDiceRegExp.test(damage);
      const finalDamage = (attackInfo && includesDice)
        ? damageModReplace(damage.replace("plus", "+"), attackInfo, dmg[4])
        : damage.replace("plus", "+");

      // if this is a save based attack, and multiple damage entries, we assume any entry beyond the first is going into
      // versatile for damage
      if (((dmg[5] && dmg[5].trim() == "on a failed save")
          || (dmg[1] && dmg[1].includes("saving throw")))
        && result.damage.parts.length >= 1
      ) {
        versatile = true;
      }
      // assumption here is that there is just one field added to versatile. this is going to be rare.
      if (other) {
        if (result.formula == "") result.formula = finalDamage;
      } else if (versatile) {
        if (result.damage.versatile == "") result.damage.versatile = finalDamage;
        // so things like the duergar mind master have oddity where we might want to use a different thing
        // } else {
        //   result.damage.versatile += ` + ${finalDamage}`;
        // }
      } else {
        result.damage.parts.push([finalDamage, dmg[4]]);
      }
    }
  }

  if (regainMatch) {
    const globalDamageHints = game.settings.get("ddb-importer", "use-damage-hints");
    const damageHint = globalDamageHints ? `[healing]` : "";
    result.damage.parts.push([utils.parseDiceString(regainMatch[3], null, damageHint).diceString, 'healing']);
  }

  const save = hit.match(/DC ([0-9]+) (.*?) saving throw|\(save DC ([0-9]+)\)/);
  if (save) {
    result.save.dc = save[1];
    result.save.ability = save[2] ? save[2].toLowerCase().substr(0, 3) : "";
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
  // foundry doesn't support mythic actions pre 1.6
  if (type === "mythic") action = "mythic";
  const actionAction = text.toLowerCase().match(/as (a|an) action/);
  const bonusAction = text.toLowerCase().match(/as a bonus action/);
  const reAction = text.toLowerCase().match(/as a reaction/);
  // e.g. mephit death
  const specialDie = text.toLowerCase().match(/dies/);
  if (bonusAction) {
    action = "bonus";
  } else if (reAction) {
    action = "reaction";
  } else if (specialDie) {
    action = "special";
  } else if (actionAction) {
    action = "action";
  }
  return action;
}

export function getUses(text, name = false) {
  let uses = {
    value: 0,
    max: 0,
    per: null,
  };

  const usesSearch = name ? /(\d+)\/(\w+)\)/ : /\((\d+)\/(\w+)\)/;
  const usesMatch = text.match(usesSearch);
  // console.log(usesMatch);
  if (usesMatch && usesMatch[2].toLowerCase() !== "turn") {
    uses.value = usesMatch[1];
    uses.max = usesMatch[1];
    uses.per = "day";
    const perMatch = DICTIONARY.monsters.resets.find((reset) => reset.id === usesMatch[2]);
    if (perMatch) uses.per = perMatch.value;
  }

  return uses;
}

export function getRecharge(text) {
  const matches = text.toLowerCase().match(/\(recharge ([0-9––−-]+)\)/);
  if (matches) {
    const value = matches[1].replace(/[––−-]/, "-").split("-").shift();
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
    range.value = parseInt(matches1[1]);
    range.long = parseInt(matches1[2]);
    range.units = "ft";
  } else if (matches2) {
    range.value = parseInt(matches2[1]);
    range.long = parseInt(matches2[2]);
    range.units = "ft";
  } else if (matches3) {
    range.value = parseInt(matches3[1]);
    range.units = "ft";
  } else if (reachMatch) {
    range.value = parseInt(reachMatch[1]);
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
  let result = duplicate(resultData);
  const abilities = ["str", "dex", "int", "wis", "cha", "con"];
  let initialAbilities = [];
  let weaponAbilities = ["str", "dex"];
  let spellAbilities = ["cha", "wis", "int"];

  const lookup = DICTIONARY.monsters.weapons.find((weapon) => result.name.startsWith(weapon.name));
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
      logger.info(`Negative ability parse for ${result.monsterName}, to hit ${result.toHit} with ${result.name}`);

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
      logger.debug("Filtered abilities", filteredAbilities);
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
  const matchText = text.replace(/[­––−-]/gu, "-").replace(/-+/g, "-");
  // console.warn(matchText);
  const lineSearch = /(\d+)-foot line/;
  const coneSearch = /(\d+)-foot cone/;
  const cubeSearch = /(\d+)-foot cube/;
  const sphereSearch = /(\d+)-foot-radius sphere/;

  const coneMatch = matchText.match(coneSearch);
  const lineMatch = matchText.match(lineSearch);
  const cubeMatch = matchText.match(cubeSearch);
  const sphereMatch = matchText.match(sphereSearch);

  // console.log(coneMatch);
  // console.log(lineMatch);
  // console.log(cubeMatch);
  // console.log(sphereMatch);

  if (coneMatch) {
    target.value = parseInt(coneMatch[1]);
    target.units = "ft";
    target.type = "cone";
  } else if (lineMatch) {
    target.value = parseInt(lineMatch[1]);
    target.units = "ft";
    target.type = "line";
  } else if (cubeMatch) {
    target.value = parseInt(cubeMatch[1]);
    target.units = "ft";
    target.type = "cube";
  } else if (sphereMatch) {
    target.value = parseInt(sphereMatch[1]);
    target.units = "ft";
    target.type = "sphere";
  }

  return target;
}

export function getActionInfo(monster, name, text) {
  const matches = text.match(
    /(Melee|Ranged|Melee\s+or\s+Ranged)\s+(|Weapon|Spell)\s*Attack:\s*([+-]\d+)\s+to\s+hit/i
  );
  const proficiencyBonus = CONFIG.DDB.challengeRatings.find((cr) => cr.id == monster.challengeRatingId).proficiencyBonus;
  const abilities = getAbilityMods(monster);

  replaceRollable(text);

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
    result.weaponAttack = matches[2].toLowerCase() === "weapon" || matches[2] === "";
    result.spellAttack = matches[2].toLowerCase() === "spell";
    result.meleeAttack = matches[1].indexOf("Melee") !== -1;
    result.rangedAttack = matches[1].indexOf("Ranged") !== -1;
    result.toHit = parseInt(matches[3]);
  }

  if (result.weaponAttack || result.spellAttack) {
    result = getWeaponAttack(result, proficiencyBonus);
  }
  const damage = getExtendedDamage(text, result);
  result.damage = damage.damage;
  result.formula = damage.formula;

  result.reach = getReach(text);
  result.range = getRange(text);
  if (result.reach != "") result.properties.rch = true;
  result.recharge = getRecharge(name);
  result.activation = getActivation(text);
  result.save = getFeatSave(text, result.save);
  result.target = getTarget(text);
  result.uses = getUses(text);

  return result;
}
