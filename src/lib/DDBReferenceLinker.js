import utils from "./utils.js";
import logger from "../logger.js";
import CompendiumHelper from "./CompendiumHelper.js";
import SETTINGS from "../settings.js";

const INDEX_COMPENDIUMS = [
  "spell",
  "item",
  "magicitem",
  "monster",
  "vehicle",
];

const ATTACK_ACTION_HINTS = {
  "Opportunity Attack": "Opportunity Attacks",
  "Grapple": "Grappling",
  "Shove": "Shoving",
  "Interact with an Object": "Use an Object",
};

const RULE_ADJUSTMENT = {
  "rule": "rules",
  "skill": "skills",
  "ability": "abilities",
  "condition": "conditions",
  "creatureType": "creatureTypes",
  "damageType": "damageTypes",
  "spellComponent": "spellComponents",
  "spellTag": "spellTags",
  "spellSchool": "spellSchools",
  "areaTargetType": "areaTargetTypes",
};

const SUPER_LOOSE = [
  "rules",
  "actions",
  "areaTargetType",
];


export async function loadDDBCompendiumIndexes() {
  for (const i of INDEX_COMPENDIUMS) {
    // eslint-disable-next-line no-await-in-loop
    await CompendiumHelper.loadCompendiumIndex(i);
  }
}


function findMatchingTagInIndex(type, tag) {
  const index = foundry.utils.hasProperty(CONFIG.DDBI, `compendium.index.${type}`)
    ? foundry.utils.getProperty(CONFIG.DDBI, `compendium.index.${type}`)
    : undefined;
  if (!index) {
    logger.warn(`Unable to load compendium ${type}s`);
    return tag;
  }
  const strippedTag = utils.stripHtml(tag);
  const match = index.find((entry) => utils.nameString(entry.name).toLowerCase() === utils.nameString(strippedTag).replace("&nbsp;", " ").toLowerCase());
  if (match) {
    const label = foundry.utils.getProperty(CONFIG.DDBI, `compendium.label.${type}`);
    return `@Compendium[${label}.${match._id}]{${tag}}`;
  } else if (strippedTag.includes(";")) {
    const tagSplit = utils.nameString(strippedTag.replace("&nbsp;", " ")).split(";")[0];
    const splitMatch = index.find((entry) => utils.nameString(entry.name).toLowerCase() === tagSplit.toLowerCase());
    if (splitMatch) {
      const label = foundry.utils.getProperty(CONFIG.DDBI, `compendium.label.${type}`);
      return `@Compendium[${label}.${splitMatch._id}]{${tagSplit}}`;
    }
  }
  logger.info(`Unable to find tag parse compendium match in ${type} for ${tag}`);
  return tag;
}


function generateDDBRuleLinks() {
  const rules = {
    "senses": { // CONFIG.DDB.senses
    },
    "actions": { // CONFIG.DDB.basicActions
    },
    "weaponproperties": { // CONFIG.DDB.weaponProperties
      // foundry does not yet have weapon property descriptions
    },
  };

  for (const sense of CONFIG.DDB.senses) {
    const slug = utils.normalizeString(sense.name);
    if (CONFIG.DND5E.rules[slug]) {
      rules.senses[slug] = {
        reference: CONFIG.DND5E.rules[slug],
        label: sense.name,
        id: sense.id,
      };
    }
  }

  for (const action of CONFIG.DDB.basicActions) {
    const slug = utils.normalizeString(action.name);
    const lookup = CONFIG.DND5E.rules[slug] ?? ATTACK_ACTION_HINTS[action.name];
    if (lookup) {
      rules.actions[slug] = {
        reference: CONFIG.DND5E.rules[slug],
        label: action.name,
        id: action.id,
      };
    }
  }

  return rules;
}


function getRuleLookups() {
  if (CONFIG.DDBI.RULE_MATCHES) return CONFIG.DDBI.RULE_MATCHES;

  const baseRules = {
    "rules": {},
    "conditions": CONFIG.DND5E.conditionTypes,
    "skills": CONFIG.DND5E.skills,
    "abilities": CONFIG.DND5E.abilities,
    "creatureTypes": CONFIG.DND5E.creatureTypes,
    "damageTypes": CONFIG.DND5E.damageTypes,
    "spellComponents": CONFIG.DND5E.spellComponents,
    "spellTags": CONFIG.DND5E.spellTags,
    "spellSchools": CONFIG.DND5E.spellSchools,
    "areaTargetTypes": CONFIG.DND5E.areaTargetTypes
  };

  const rules = {};
  for (const [key, value] of Object.entries(CONFIG.DND5E.rules)) {
    rules[key] = {
      label: utils.capitalize(key),
      reference: value,
    };
  }
  baseRules["rules"] = foundry.utils.mergeObject(foundry.utils.mergeObject({}, rules), baseRules.spellTags);
  CONFIG.DDBI.RULE_MATCHES = foundry.utils.mergeObject(baseRules, generateDDBRuleLinks());
  return CONFIG.DDBI.RULE_MATCHES;
}


/**
 * Replaces a rule based on the given type, reference, slug, and forceTrimCheck flag.
 *
 * @param {string} baseType - The base type of the rule.
 * @param {string} text - The text to be replaced/used as description.
 * @param {string} slug - The slug to identify the rule.
 * @param {boolean} forceTrimCheck - Optional flag to force trim check.
 * @return {string} The replaced reference based on the rule.
 */
function ruleReplacer(baseType, text, slug, forceTrimCheck = false) {
  const type = RULE_ADJUSTMENT[baseType] ?? baseType;

  const rules = getRuleLookups()[type];
  if (!rules) return text;

  if (forceTrimCheck || ["abilities", "skills", "spellSchools"].includes("type")) {
    // ensure it's not a trimmed slug
    const trimmedSlug = slug.substring(0, 3).toLowerCase();
    if (rules[trimmedSlug] && type[trimmedSlug].reference) {
      const result = `&Reference[${trimmedSlug}]{${text}}`;
      return result;
    }
  }

  if (rules[slug] && rules[slug].reference) {
    const result = `&Reference[${slug}]{${text}}`;
    return result;
  }

  return text;
}

/**
 * Replaces a tag in the given string with a modified version.
 *  /(\[([^\]]+)]([^[]+)\[\/([^\]]+)]/g;
 *
 * @param {string} match - the entire matched string
 * @param {string} tagType - tag name e.g. skills
 * @param {string} tagName - tag name e.g. Acrobatics
 * @param {number} _p4 - final tag closure
 * @param {number} _offset - the zero-based index of the match in the string
 * @param {string} _string - the input string
 * @return {string} the modified string with the replaced tag
 */
// eslint-disable-next-line no-unused-vars
function replaceTag(match, tagType, tagName, _p4, _offset, _string) {
  if (!tagName) {
    logger.warn(`Unable to tag parse ${match}`);
    return match;
  }

  if (INDEX_COMPENDIUMS.includes(tagType)) {
    return findMatchingTagInIndex(tagType, tagName);
  }

  const strippedP2 = utils.stripHtml(tagName);
  const lowerCaseTag = utils.normalizeString(strippedP2);
  const result = ruleReplacer(tagType, tagName, lowerCaseTag);

  return result;
}

/**
 * Parses loose rule references in the given text.
 * Fast and loose search and replace
 *
 * @param {string} text - The text to parse rule references from
 * @param {boolean} superLoose - Flag to indicate whether to allow super loose rule references
 * @return {string} The parsed text with rule references replaced
 */
function parseLooseRuleReferences(text, superLoose = false) {
  for (const [type, entries] of Object.entries(getRuleLookups())) {
    // console.error(`Reference Check`, { text });
    // eslint-disable-next-line no-continue
    if (!superLoose && SUPER_LOOSE.includes(type)) continue;
    for (const [key, value] of Object.entries(entries)) {
      // eslint-disable-next-line no-continue
      if (!value.reference) continue;
      const linkRegEx = new RegExp(`(&Reference)?(^| |\\(|\\[|>)(DC (\\d\\d) )?(${value.label})( (saving throw|average=true|average=false))?( |\\)|\\]|\\.|,|$|\\n|<)`, "ig");
      const replaceRule = (match, p1, p2, p3, p4, p5, p6, p7, p8) => {
        // console.warn("match", { match, p1, p2, p3, p4, p5, p6, p7, p8 });
        if (p1 || (p7 && p7.includes("average="))) return match; // already a reference match don't match this
        if (p3 && Number.isInteger(parseInt(p4)) && p7) {
          if (p7.toLowerCase() === "saving throw") {
            return `${p2}[[/save ${key} ${p4} format=long]]${p8}`;
          }
        }
        return `${p2}${p3 ?? ""}&Reference[${key}]{${p5}}${p6 ?? ""}${p8}`;
      };
      text = text.replaceAll(linkRegEx, replaceRule);
    }
  }


  return text;
}

function parseHardReferenceTag(type, text) {
  const index = foundry.utils.hasProperty(CONFIG.DDBI, `compendium.index.${type}`)
    ? foundry.utils.getProperty(CONFIG.DDBI, `compendium.index.${type}`)
    : undefined;
  if (!index) {
    logger.warn(`Unable to load compendium ${type}s`);
    return text;
  }

  const referenceRegexReplacer = (match, referenceName, postfix) => {
    const cMatch = index.find((f) => f.name.toLowerCase() === referenceName.toLowerCase());
    const replacedText = cMatch ? `@UUID[${cMatch.uuid}]{${referenceName}}` : referenceName;
    // console.warn("match", { match, document, prefix, spellName, postfix, compendium: this.spellCompendium.index, cMatch, replacedSpell });
    return `${replacedText}${postfix}`;
  };


  if (["spell"].includes(type.toLowerCase())) {
    // easiest, e.g.wand of fireballs
    const simpleStrongRegex = /(?:<strong>)([\w\s]*?)(?:<\/strong>)(\s*spell)/gi;
    text = `${text}`.replaceAll(simpleStrongRegex, referenceRegexReplacer);
    // <strong>cone of cold</strong> (5 charges)
    const chargeSpellRegex = /(?:<strong>)([\w\s]*?)(?:<\/strong>)(\s*\(\d* charge)/gi;
    text = `${text}`.replaceAll(chargeSpellRegex, referenceRegexReplacer);
  } else if (["item", "magicitem"].includes(type)) {
    // easiest, e.g.wand of fireballs
    const simpleStrongRegex = /(?:<strong>)([\w\s]*?)(?:<\/strong>)(\s*item)/gi;
    text = `${text}`.replaceAll(simpleStrongRegex, referenceRegexReplacer);
  }

  return text;
}

function damageRollGenerator({ text, damageType, actor, document, extraMods = [] } = {}) {
  let result;
  const damageHint = damageType ? ` type=${damageType}` : "";
  const diceParse = utils.parseDiceString(text, null, "");
  const baseAbility = foundry.utils.getProperty(document, "flags.monstermunch.actionInfo.baseAbility");
  const mods = extraMods.join(" + ");

  if (baseAbility) {
    const baseAbilityMod = actor.system.abilities[baseAbility].mod;
    const bonusMod = (diceParse.bonus && diceParse.bonus !== 0) ? diceParse.bonus - baseAbilityMod : "";
    const useMod = (diceParse.bonus && diceParse.bonus !== 0) ? " + @mod " : "";
    const finalMods = mods.length > 0
      ? `${useMod} + ${mods}`
      : useMod;
    const reParse = utils.diceStringResultBuild(diceParse.diceMap, diceParse.dice, bonusMod, finalMods, "");
    result = `[[/damage ${reParse.diceString}${damageHint} average=true]]`;
  } else {
    const reParse = utils.diceStringResultBuild(diceParse.diceMap, diceParse.dice, undefined, mods, "");
    result = `[[/damage ${reParse.diceString}${damageHint} average=true]]`;
  }

  return result;
}

export function parseDamageRolls({ text, document, actor } = {}) {
  // (2d8 + 3) piercing damage
  // [[/damage 2d6 fire average=true]]
  // 5 (1d4 + 3) piercing damage plus 10 (3d6) psychic damage, or 1 piercing damage plus 10 (3d6) psychic damage while under the effect of Reduce.

  const strippedHtml = utils.stripHtml(`${text}`).trim();

  const hitIndex = strippedHtml.indexOf("Hit:");
  let hit = (hitIndex > 0) ? strippedHtml.slice(hitIndex) : `${strippedHtml}`;
  hit = hit.split("At the end of each")[0].split("At the start of each")[0];
  hit = hit.replace(/[–-–−]/g, "-");
  const damageExpression = new RegExp(/((?:takes|plus|saving throw or take\s+)|(?:[\w]*\s+))(?:([0-9]+))?(?:\s*\(?([0-9]*d[0-9]+(?:\s*[-+]\s*(?:[0-9]+|PB|the spell[’']s level))*(?:\s+plus [^)]+)?)\)?)?\s*([\w ]*?)\s*damage/gi);

  const matches = [...hit.matchAll(damageExpression)];
  const regainExpression = new RegExp(/(regains|regain)\s+?(?:([0-9]+))?(?: *\(?([0-9]*d[0-9]+(?:\s*[-+]\s*[0-9]+)??)\)?)?\s+hit\s+points/);

  const regainMatch = hit.match(regainExpression);

  logger.debug(`${document.name} Damage matches`, { hit, matches, regainMatch });

  const includesDiceRegExp = /[0-9]*d[0-9]+/;

  for (const dmg of matches) {
    if (dmg[1] == "DC " || dmg[4] == "hit points by this") {
      continue; // eslint-disable-line no-continue
    }

    const bonusMods = [];
    if (dmg[3]?.includes(" + PB") || dmg[3]?.includes(" plus PB")) bonusMods.push("@prof");
    if (dmg[3] && (/the spell[’']s level/i).test(dmg[3])) bonusMods.push("@item.level");

    const damage = bonusMods.length > 0
      ? `${dmg[2]}${dmg[3].replace(" + PB", "").replace(" plus PB", "").replace(" + the spell’s level", "").replace(" + the spell's level", "")}`
      : dmg[3] ?? dmg[2];

    if (damage && includesDiceRegExp.test(damage)) {
      const parsedDiceDamage = damageRollGenerator({ text: damage, damageType: dmg[4], actor, document });
      const replaceValue = `${dmg[1]}${parsedDiceDamage} damage`;
      // console.warn("DAMAGE PARSE", {
      //   damage,
      //   dmg,
      //   parsedDiceDamage,
      //   replaceValue,
      // });

      text = text.replace(dmg[0], replaceValue);

    } else {
      const noDiceRegex = /(\d+) (\w+) damage/i;
      const fixedDamageMatch = dmg[0].match(noDiceRegex);
      // console.warn("no dice match",{
      //   noDiceRegex,
      //   fixedDamageMatch,
      //   dmg
      // })
      if (fixedDamageMatch) {
        text = text.replace(fixedDamageMatch[0], `[[/damage ${fixedDamageMatch[1]} ${fixedDamageMatch[2]} average=false]] damage`);
      }
    }
  }

  if (regainMatch) {
    const damageValue = regainMatch[3] ? regainMatch[3] : regainMatch[2];
    const parsedDiceDamage = Number.isInteger(parseInt(damageValue))
      ? `[[/damage ${damageValue} type=heal average=false]]`
      : damageRollGenerator({ text: damageValue, damageType: "heal", actor, document });
    const replaceValue = `${regainMatch[1]} ${parsedDiceDamage} hit points`;
    // console.warn("DAMAGE PARSE", {
    //   regainMatch,
    //   damageValue,
    //   parsedDiceDamage,
    //   replaceValue,
    // });

    text = text.replace(regainMatch[0], replaceValue);
  }

  return text;
}

export function parseToHitRoll({ text, document } = {}) {

  if (!document) return text;

  const matches = utils.stripHtml(`${text}`).trim().match(
    /(?:Melee|Ranged|Melee\s+or\s+Ranged)\s+(?:|Weapon|Spell)\s*Attack:\s*([+-]\d+|your (?:\w+\s*)*)(?:,)?\s+(plus PB\s|\+ PB\s)?to\s+hit/i
  );

  const toHit = matches && Number.isInteger(parseInt(matches[1]));

  if (!toHit) return text;

  const ability = foundry.utils.getProperty(document, "flags.monstermunch.actionInfo.baseAbility");
  const proficient = foundry.utils.getProperty(document, "flags.monstermunch.actionInfo.proficient") ? " + @prof" : "";
  const extraNum = foundry.utils.getProperty(document, "flags.monstermunch.actionInfo.extraAttackBonus");
  const extra = extraNum === 0 ? "" : ` + ${extraNum}`;
  const result = `[[/roll 1d20 + @abilities.${ability}.mod${proficient}${extra}]]`;

  text = text.replace(matches[1], result);

  return text;

}

export function parseTags(text) {
  text = parseHardReferenceTag("spell", text);
  text = parseHardReferenceTag("item", text);
  const tagRegEx = /\[([^\]]+)]([^[]+)\[\/([^\]]+)]/g;
  const matches = text.match(tagRegEx);
  if (matches) {
    return text.replaceAll(tagRegEx, replaceTag);
  }
  if (game.settings.get(SETTINGS.MODULE_ID, "use-loose-srd-reference-matching")) {
    const superLoose = game.settings.get(SETTINGS.MODULE_ID, "use-super-loose-srd-reference-matching");
    text = parseLooseRuleReferences(text, superLoose);
  }
  return text;
}


export async function importCacheLoad() {
  await loadDDBCompendiumIndexes();
  getRuleLookups();
}
