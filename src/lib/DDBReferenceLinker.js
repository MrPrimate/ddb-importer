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
  const index = hasProperty(CONFIG.DDBI, `compendium.index.${type}`)
    ? getProperty(CONFIG.DDBI, `compendium.index.${type}`)
    : undefined;
  if (!index) {
    logger.warn(`Unable to load compendium ${type}s`);
    return tag;
  }
  const strippedTag = utils.stripHtml(tag);
  const match = index.find((entry) => utils.nameString(entry.name).toLowerCase() === utils.nameString(strippedTag).replace("&nbsp;", " ").toLowerCase());
  if (match) {
    const label = getProperty(CONFIG.DDBI, `compendium.label.${type}`);
    return `@Compendium[${label}.${match._id}]{${tag}}`;
  } else if (strippedTag.includes(";")) {
    const tagSplit = utils.nameString(strippedTag.replace("&nbsp;", " ")).split(";")[0];
    const splitMatch = index.find((entry) => utils.nameString(entry.name).toLowerCase() === tagSplit.toLowerCase());
    if (splitMatch) {
      const label = getProperty(CONFIG.DDBI, `compendium.label.${type}`);
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
  baseRules["rules"] = mergeObject(mergeObject({}, rules), baseRules.spellTags);
  CONFIG.DDBI.RULE_MATCHES = mergeObject(baseRules, generateDDBRuleLinks());
  return CONFIG.DDBI.RULE_MATCHES;
}


/**
 * Replaces a rule based on the given type, reference, slug, and forceTrimCheck flag.
 *
 * @param {string} baseType - The base type of the rule.
 * @param {string} reference - The reference to be replaced.
 * @param {string} slug - The slug to identify the rule.
 * @param {boolean} forceTrimCheck - Optional flag to force trim check.
 * @return {string} The replaced reference based on the rule.
 */
function ruleReplacer(baseType, reference, slug, forceTrimCheck = false) {
  const type = RULE_ADJUSTMENT[baseType] ?? baseType;

  const rules = getRuleLookups()[type];
  if (!rules) return reference;

  if (forceTrimCheck || ["abilities", "skills", "spellSchools"].includes("type")) {
    // ensure it's not a trimmed slug
    const trimmedSlug = slug.substring(0, 3).toLowerCase();
    if (rules[trimmedSlug] && type[trimmedSlug].reference) {
      const result = `&Reference[${trimmedSlug}]{${reference}}`;
      return result;
    }
  }

  if (rules[slug] && type[slug].reference) {
    const result = `&Reference[${slug}]{${reference}}`;
    return result;
  }

  return reference;
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
    console.error(`Parsing ${type}`);
    // eslint-disable-next-line no-continue
    if (!superLoose && SUPER_LOOSE.includes(type)) continue;
    for (const [key, value] of Object.entries(entries)) {
      // eslint-disable-next-line no-continue
      if (!value.reference) continue;
      const linkRegEx = new RegExp(`(&Reference)?(^| |\\(|\\[|>)(${value.label})( |\\)|\\]|\\.|,|$|\\n|<)`, "ig");
      const replaceRule = (match, p1, p2, p3, p4) => {
        console.warn("match", { match, p1, p2, p3, p4 });
        if (p1) return match; // already a reference match don't match this
        return `${p2}&Reference[${key}]{${p3}}${p4}`;
      };
      text = text.replaceAll(linkRegEx, replaceRule);
    }
  }


  return text;
}

function parseHardReferenceTag(type, text) {
  const index = hasProperty(CONFIG.DDBI, `compendium.index.${type}`)
    ? getProperty(CONFIG.DDBI, `compendium.index.${type}`)
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
