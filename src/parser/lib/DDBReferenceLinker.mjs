import { utils, logger, CompendiumHelper } from "../../lib/_module.mjs";
import { SETTINGS } from "../../config/_module.mjs";

const INDEX_COMPENDIUMS = [
  "spell",
  "spells",
  "item",
  "items",
  "magicitems",
  "monsters",
  "magicitem",
  "monster",
  "vehicle",
  "vehicles",
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
  "weaponMastery": "weaponMasteries",
};

const SUPER_LOOSE = [
  "rules",
  "actions",
  "areaTargetTypes",
  "creatureTypes",
  "damageTypes",
];


export async function loadDDBCompendiumIndexes() {
  for (const i of INDEX_COMPENDIUMS) {
    await CompendiumHelper.loadCompendiumIndex(i, {
      fields: [
        "name",
        "flags.ddbbimporter.id",
        "system.source.rules",
      ],
    });
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
    "conditions": CONFIG.DND5E.conditionTypes ?? {},
    "skills": CONFIG.DND5E.skills ?? {},
    "abilities": CONFIG.DND5E.abilities ?? {},
    "creatureTypes": CONFIG.DND5E.creatureTypes ?? {},
    "damageTypes": CONFIG.DND5E.damageTypes ?? {},
    "spellComponents": CONFIG.DND5E.spellComponents ?? {},
    "spellTags": CONFIG.DND5E.spellTags ?? {},
    "spellSchools": CONFIG.DND5E.spellSchools ?? {},
    "areaTargetTypes": CONFIG.DND5E.areaTargetTypes ?? {},
    "weaponMasteries": CONFIG.DND5E.weaponMasteries ?? {},
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
 * @param {string} baseType The base type of the rule.
 * @param {string} text The text to be replaced/used as description.
 * @param {string} slug The slug to identify the rule.
 * @param {boolean} forceTrimCheck Optional flag to force trim check.
 * @returns {string} The replaced reference based on the rule.
 */
function ruleReplacer(baseType, text, slug, forceTrimCheck = false) {
  if (slug.includes("Reference")) {
    return text;
  }
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
 * @param {string} match the entire matched string
 * @param {string} tagType tag name e.g. skills
 * @param {string} tagName tag name e.g. Acrobatics
 * @param {number} _p4 final tag closure
 * @param {number} _offset the zero-based index of the match in the string
 * @param {string} _string the input string
 * @returns {string} the modified string with the replaced tag
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
 * @param {string} text The text to parse rule references from
 * @param {boolean} superLoose Flag to indicate whether to allow super loose rule references
 * @returns {string} The parsed text with rule references replaced
 */
function parseLooseRuleReferences(text, superLoose = false) {
  for (const [type, entries] of Object.entries(getRuleLookups())) {
    // console.error(`Reference Check`, { text });
    // eslint-disable-next-line no-continue
    if (!superLoose && SUPER_LOOSE.includes(type)) continue;
    for (const [key, value] of Object.entries(entries)) {
      if (!value.reference) continue;
      const newLinkRegex = new RegExp(`(&(?:amp;)*Reference)?(^| |\\(|\\[|>)(${value.label})( (saving throw:|check:|average=true|average=false))?(<\\/\\w+>)?(\\sDC (\\d\\d))?( |\\)|\\]|\\.|,|$|\\n|<)`, "ig");
      const replaceRuleNew = (match, p1, p2, p3, p4, p5, p6, p7, p8, p9) => {
        if (p1 || (p5 && p5.includes("average="))) return match; // already a reference match don't match this
        if (p5 && ["saving throw:", "check:"].includes(p5.toLowerCase().trim())) {
          const rollType = p5.toLowerCase() === "check:" ? "check" : "save";
          // console.warn("Unexpected Reference", { match, p1, p2, p3,p4, p5, p6, p7, p8, p9, rollType });
          const tag = p6 ? p6 : "";
          if (p7 && Number.isInteger(parseInt(p8))) {
            return `${p2}${p3}${p4}${tag}[[/${rollType} ${key} ${p8} format=long]]{${p7}}${p9}`;
          } else {
            return `${p2}[[/${rollType} ${key} format=long]]${tag}${p9}`;
          }
        }
        return match;
      };
      // eslint-disable-next-line no-continue
      text = text.replaceAll(newLinkRegex, replaceRuleNew);

      const linkRegEx = new RegExp(`(&(?:amp;)*Reference)?(^| |\\(|\\[|>)(DC (\\d\\d) )?(${value.label})( (saving throw|check|average=true|average=false))?( \\(DC 8 plus your ${value.label} modifier and Proficiency Bonus\\))?( |\\)|\\]|\\.|,|$|\\n|<)`, "ig");
      const replaceRule = (match, p1, p2, p3, p4, p5, p6, p7, p8, p9) => {
        if (p1 || (p7 && p7.includes("average="))) return match; // already a reference match don't match this
        if (p7 && ["saving throw", "check"].includes(p7.toLowerCase())) {
          const rollType = p7.toLowerCase() === "check" ? "check" : "save";
          if (p3 && Number.isInteger(parseInt(p4))) {
            return `${p2}[[/${rollType} ${key} ${p4} format=long]]${p9}`;
          } else if (p8 && p8.includes("DC 8 plus your")) {
            return `${p2}[[/${rollType} ${key} dc=8+@abilities.${key}.mod+@prof ${p4 ?? ""} format=long]]${p9}`;
          } else {
            return `${p2}[[/${rollType} ${key} format=long]]${p9}`;
          }
        }
        if (type === "abilities") return match;
        return `${p2}${p3 ?? ""}&Reference[${key}]{${p5}}${p6 ?? ""}${p9}`;
      };
      text = text.replaceAll(linkRegEx, replaceRule);
    }
  }


  return text;
}

function parseHardCompendiumReferenceTag(type, text) {
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


  if (["spell", "spells"].includes(type.toLowerCase())) {
    // easiest, e.g.wand of fireballs
    const simpleStrongRegex = /(?:<strong>)([\w\s]*?)(?:<\/strong>)(\s*spell)/gi;
    text = `${text}`.replaceAll(simpleStrongRegex, referenceRegexReplacer);
    // <strong>cone of cold</strong> (5 charges)
    const chargeSpellRegex = /(?:<strong>)([\w\s]*?)(?:<\/strong>)(\s*\(\d* charge)/gi;
    text = `${text}`.replaceAll(chargeSpellRegex, referenceRegexReplacer);
  } else if (["item", "items", "magicitem", "magicitems"].includes(type)) {
    // easiest, e.g.wand of fireballs
    const simpleStrongRegex = /(?:<strong>)([\w\s]*?)(?:<\/strong>)(\s*item)/gi;
    text = `${text}`.replaceAll(simpleStrongRegex, referenceRegexReplacer);
  }

  return text;
}

function damageRollGenerator({ text, damageType, actor, document, extraMods = [] } = {}) {
  let result;
  const types = damageType.replace(", or ", ",").replace(" or ", ",").split(",").map((s) => s.trim().toLowerCase());
  const damageHint = damageType ? ` type=${types.join("/")}` : "";
  const diceParse = utils.parseDiceString(text, null, "");
  const baseAbility = foundry.utils.getProperty(document, "flags.monsterMunch.actionInfo.baseAbility");
  const mods = extraMods.join(" + ");

  if (baseAbility) {
    const baseAbilityMod = actor ? actor.system.abilities[baseAbility].mod : diceParse.bonus;
    const bonusMod = (diceParse.bonus && diceParse.bonus !== 0) ? diceParse.bonus - baseAbilityMod : "";
    const useMod = (diceParse.bonus && diceParse.bonus !== 0) ? ` + @abilities.${baseAbility}.mod ` : "";
    const finalMods = extraMods.length > 0
      ? `${useMod} + ${mods}`
      : useMod;

    // console.warn("RESULTS1", {
    //   text,
    //   diceParse,
    //   baseAbility,
    //   baseAbilityMod,
    //   bonusMod,
    //   useMod,
    //   finalMods,
    //   mods,
    // });

    const reParse = utils.diceStringResultBuild(diceParse.diceMap, diceParse.dice, bonusMod, finalMods, "");
    result = `[[/damage ${reParse.diceString}${damageHint} average=true]]`;
  } else {
    // console.warn("RESULTS2", {
    //   text,
    //   diceParse,
    //   baseAbility,
    //   document,
    //   mods
    // });
    // const reParse = utils.diceStringResultBuild(diceParse.diceMap, diceParse.dice, undefined, mods, "");
    // result = `[[/damage ${reParse.diceString}${damageHint} average=true]]`;
    const finalMods = extraMods.length > 0
      ? ` + ${mods}`
      : "";
    result = `[[/damage ${diceParse.diceString}${finalMods}${damageHint} average=true]]`;
  }

  return result;
}

// eslint-disable-next-line complexity
export function parseDamageRolls({ text, document, actor } = {}) {
  // (2d8 + 3) piercing damage
  // [[/damage 2d6 fire average=true]]
  // 5 (1d4 + 3) piercing damage plus 10 (3d6) psychic damage, or 1 piercing damage plus 10 (3d6) psychic damage while under the effect of Reduce.

  const strippedHtml = utils.stripHtml(`${text}`).trim();

  const hitIndex = strippedHtml.indexOf("Hit:");
  let hit = (hitIndex > 0) ? strippedHtml.slice(hitIndex) : `${strippedHtml}`;
  hit = hit.split("At the end of each")[0].split("At the start of each")[0];
  hit = hit.replace(/[–-–−]/g, "-");
  const damageExpression = new RegExp(/((?:takes\s+|plus\s+|or take\s+|taking\s+)|(?:[\w]*\s+))(?:([0-9]+))?(?:\s*\(?([0-9]*d[0-9]+(?:\s*[-+]\s*(?:[0-9]+|PB|the spell[’']s level))*(?:\s+plus [^)]+)?)\)?)\s*([\w ]*?)\s*damage/gi);

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
      : dmg[3] && dmg[3].startsWith("d") // satisfies parsing where no average damage e.g. horn of blasting summary
        ? `${dmg[2] ?? ""}${dmg[3] ?? ""}`
        : dmg[3] ?? dmg[2];

    if (damage && includesDiceRegExp.test(damage)) {
      const parsedDiceDamage = damageRollGenerator({ text: damage, damageType: dmg[4], actor, document, extraMods: bonusMods });
      const replaceValue = `${dmg[1]} ${parsedDiceDamage} damage`;
      // console.warn("DAMAGE PARSE", {
      //   damage,
      //   dmg,
      //   parsedDiceDamage,
      //   replaceValue,
      //   bonusMods,
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
    const damageValue = regainMatch[3]
      ? regainMatch[2]
        ? `${regainMatch[2]}${regainMatch[3]}`
        : regainMatch[3]
      : regainMatch[2];
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

  text = text.replace("<strong></strong>", "");
  if (!document) return text;

  const matches = utils.stripHtml(`${text}`).trim().match(
    // /(?:Melee|Ranged|Melee\s+or\s+Ranged)\s+(?:|Weapon|Spell)\s*Attack:\s*([+-]\d+|your (?:\w+\s*)*)(?:,)?\s+(plus PB\s|\+ PB\s)?to\s+hit/i,
    /(?<range>Melee|Ranged|Melee\s+or\s+Ranged)\s+(?<type>|Weapon|Spell)\s*(?<attackRoll>Attack|Attack Roll):\s*(?<toHitString>(?<bonus>[+-]\d+|your (?:\w+\s*)*)\s*(?<pb>plus PB\s|\+ PB\s)?(?:to\s+hit,|,|\(|\.))/i,
  );

  const toHit = matches && Number.isInteger(parseInt(matches.groups?.bonus));


  if (!toHit) return text;

  const useExtendedAttackEnricher = true;
  if (useExtendedAttackEnricher) {
    const htmlReplace = /<em>\s*((?:Melee|Ranged|Melee\s+or\s+Ranged)\s+(?:|Weapon|Spell)\s*(?:Attack|Attack Roll):\s*)<\/em>/i;
    text = text.replace(htmlReplace, "$1");
    text = text.replace(matches[0], "[[/attack extended]],");

    return text;
  }

  const ability = foundry.utils.getProperty(document, "flags.monsterMunch.actionInfo.baseAbility");
  const proficient = foundry.utils.getProperty(document, "flags.monsterMunch.actionInfo.proficient") ? " + @prof" : "";
  const extraNum = foundry.utils.getProperty(document, "flags.monsterMunch.actionInfo.extraAttackBonus");
  const extra = extraNum === 0 ? "" : ` + ${extraNum}`;
  const result = `[[/roll 1d20 + @abilities.${ability}.mod${proficient}${extra}]]`;

  text = text.replace(matches[1], result);

  return text;

}

export function parseTags(text) {
  for (const tag of ["spell", "item", "spells", "items"]) {
    text = parseHardCompendiumReferenceTag(tag, text);
  }
  const tagRegEx = /\[([^\]]+)]{?([^[}]+)}?\[\/([^\]]+)]/g;
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

const COMPENDIUM_MAP = {
  "spells": "spells",
  "magicitems": "items",
  "weapons": "items",
  "armor": "items",
  "adventuring-gear": "items",
  "monsters": "monsters",
  "vehicles": "vehicles",
};

// const DDB_MAP = {
//   "spells": "spells",
//   "magicitems": "magic-items",
//   "weapons": "equipment",
//   "armor": "equipment",
//   "adventuring-gear": "equipment",
//   "monsters": "monsters",
//   "vehicles": "vehicles",
// };

// <a class=\"tooltip-hover spell-tooltip\" href=\"/spells/2095-feather-fall\" aria-haspopup=\"true\" data-tooltip-href=\"/spells/2095-tooltip\" data-tooltip-json-href=\"/spells/2095/tooltip-json\">Feather Fall</a>
// <a class=\"tooltip-hover monster-tooltip\" href=\"/monsters/16781-ancient-green-dragon\" aria-haspopup=\"true\" data-tooltip-href=\"/monsters/16781-tooltip\" data-tooltip-json-href=\"/monsters/16781/tooltip-json\">ancient</a>
function replaceHREFLookupLinks(doc, actor) {
  const rules = actor?.system?.source?.rules ?? "2014";
  let npcLookup = null;

  if (actor) {
    const label = foundry.utils.getProperty(CONFIG.DDBI, `compendium.label.monsters`);
    npcLookup = {
      compendiumRef: true,
      uuid: `${label}.${actor._id}`,
    };
  }

  for (const lookupKey in COMPENDIUM_MAP) {
    const compendiumLinks = doc.querySelectorAll(`a[href*="/${lookupKey}/"]`);
    const lookupRegExp = new RegExp(`/${lookupKey}/([0-9]*)-(.*)`);
    compendiumLinks.forEach((node) => {
      const lookupMatch = node.href.match(lookupRegExp);

      const lookupValue = foundry.utils.hasProperty(CONFIG.DDBI, `compendium.index.${COMPENDIUM_MAP[lookupKey]}`)
        ? foundry.utils.getProperty(CONFIG.DDBI, `compendium.index.${COMPENDIUM_MAP[lookupKey]}`)
        : undefined;
      if (!lookupValue) {
        logger.warn(`Unable to load compendium for ${lookupKey}`);
      }

      if (lookupValue) {
        const name = lookupMatch[2].split("-").join(" ");
        const lookupEntry = lookupValue.find((e) =>
          e.name.split(" ").map((n) => utils.normalizeString(n)).join(" ").toLowerCase() == name.toLowerCase()
          && e.system?.source?.rules === rules,
          // we would normally prefer and id lookup, but right now the ids to spells and monsters reference legacy version on 2024 monsters
        )
        ?? npcLookup
        ?? lookupValue.find((e) => e.flags?.ddbimporter?.id == lookupMatch[1]);

        if (lookupEntry) {
          const prefix = lookupValue.compendiumRef ? "Compendium" : "UUID";
          doc.body.innerHTML = doc.body.innerHTML.replace(node.outerHTML, `@${prefix}[${lookupEntry.uuid}]{${node.textContent}}`);
        } else {
          node.setAttribute("href", node.href.replace(document.location.origin, "https://www.dndbeyond.com"));
          logger.warn(`NO Lookup Compendium Entry for ${node.outerHTML}, using key "${lookupKey}"`, {
            lookupRegExp,
            lookupKey,
            href: node.href,
            name,
            lookupValue,
            rules,
          });
        }
      } else {
        node.setAttribute("href", node.href.replace(document.location.origin, "https://www.dndbeyond.com"));
        logger.warn(`NO Lookup Compendium for ${node.outerHTML}, using key "${lookupKey}"`, {
          lookupRegExp,
          lookupKey,
          href: node.href,
        });
      }
    });
  }

  return doc;
};

const TOOLTIP_MAP = {
  "skills": {
    path: "DDBI.DICTIONARY.actor.skills",
    id: "valueId",
    foundry: "subType",
  },
  "conditions": {
    path: "DDBI.DICTIONARY.conditions",
    id: "ddbId",
    foundry: "foundry",
  },
  "senses": {
    path: "DDBI.DICTIONARY.actor.senses",
    id: "id",
    foundry: "name",
  },
};

// <a class=\"tooltip-hover skill-tooltip\" href=\"/sources/dnd/free-rules/playing-the-game#Skills\" aria-haspopup=\"true\" data-tooltip-href=\"/skills/6-tooltip\" data-tooltip-json-href=\"/skills/6/tooltip-json\">Arcana</a>
// <a class=\"tooltip-hover sense-tooltip\" href=\"/sources/dnd/free-rules/rules-glossary#Blindsight\" aria-haspopup=\"true\" data-tooltip-href=\"/senses/1-tooltip\" data-tooltip-json-href=\"/senses/1/tooltip-json\">Blindsight</a>
// <a class=\"tooltip-hover sense-tooltip\" href=\"/sources/dnd/free-rules/rules-glossary#Darkvision\" aria-haspopup=\"true\" data-tooltip-href=\"/senses/2-tooltip\" data-tooltip-json-href=\"/senses/2/tooltip-json\">Darkvision</a>
// <a class=\"tooltip-hover condition-tooltip\" href=\"/sources/dnd/free-rules/rules-glossary#CharmedCondition\" aria-haspopup=\"true\" data-tooltip-href=\"/conditions/2-tooltip\" data-tooltip-json-href=\"/conditions/2/tooltip-json\">Charmed</a>
// <a class=\"tooltip-hover condition-tooltip\" href=\"/sources/dnd/free-rules/rules-glossary#PoisonedCondition\" aria-haspopup=\"true\" data-tooltip-href=\"/conditions/11-tooltip\" data-tooltip-json-href=\"/conditions/11/tooltip-json\">Poisoned</a>
// <a class=\"tooltip-hover condition-tooltip\" href=\"/sources/dnd/free-rules/rules-glossary#ExhaustionCondition\" aria-haspopup=\"true\" data-tooltip-href=\"/conditions/4-tooltip\" data-tooltip-json-href=\"/conditions/4/tooltip-json\">Exhaustion</a>
function replaceHREFRules(doc) {
  for (const [lookupKey, lookupData] of Object.entries(TOOLTIP_MAP)) {
    const compendiumLinks = doc.querySelectorAll(`a[data-tooltip-json-href*="/${lookupKey}/"]`);
    const lookupRegExp = new RegExp(`/${lookupKey}/([0-9]*)/`);
    compendiumLinks.forEach((node) => {
      const lookupMatch = node.outerHTML.match(lookupRegExp);
      const dict = foundry.utils.getProperty(CONFIG, lookupData.path);
      const data = dict.find((d) => Number.parseInt(d[lookupData.id]) === Number.parseInt(lookupMatch[1]));

      const lookupValue = data[lookupData.foundry];

      if (lookupValue) {
        const lowerCaseTag = utils.normalizeString(lookupValue);
        const replacement = ruleReplacer(lookupKey, lookupValue, lowerCaseTag);
        doc.body.innerHTML = doc.body.innerHTML.replace(node.outerHTML, replacement);
      } else {
        node.setAttribute("href", node.href.replace(document.location.origin, "https://www.dndbeyond.com"));
        logger.warn(`NO Lookup Compendium for ${node.outerHTML}, using key "${lookupKey}"`, {
          lookupRegExp,
          lookupKey,
          href: node.href,
        });
      }
    });
  }

  return doc;
}

// Not handled
// <span data-dicenotation=\"1d20+5\" data-rolltype=\"to hit\" data-rollaction=\"Wind Staff\">+5</span>
// <span data-dicenotation=\"1d8+3\" data-rolltype=\"damage\" data-rollaction=\"Wind Staff\" data-rolldamagetype=\"Bludgeoning\">(1d8 + 3)</span>
// <span data-dicenotation=\"1d6\" data-rolltype=\"recharge\" data-rollaction=\"Poison Breath\">(Recharge 5–6)</span>

function removeDDBToolTipLinks(doc) {
  const compendiumLinks = doc.querySelectorAll(`a[data-tooltip-href*="/"]`);
  compendiumLinks.forEach((node) => {
    doc.body.innerHTML = doc.body.innerHTML.replace(node.outerHTML, node.innerHTML);
  });
  const rollTypeLinks = doc.querySelectorAll(`a[data-rolltype*="/"]`);
  rollTypeLinks.forEach((node) => {
    doc.body.innerHTML = doc.body.innerHTML.replace(node.outerHTML, node.innerHTML);
  });
  return doc;
}


// eslint-disable-next-line no-unused-vars
export function replaceMonsterALinks(str, actor) {
  let doc = utils.htmlToDoc(str);
  doc = replaceHREFLookupLinks(doc, actor);
  doc = replaceHREFRules(doc);
  doc = removeDDBToolTipLinks(doc);
  return doc.body.innerHTML;
}


export async function replaceMonsterNameBadLinks(str, actor) {

  const rules = actor?.system?.source?.rules ?? "2014";
  const name = actor?.name ?? "Unknown";

  const pack = CompendiumHelper.getCompendiumType("monsters", false);
  await pack.getIndex({ fields: ["name", "system.source.rules"] });

  const packs = {
    "monsters": pack,
  };

  str = utils.nameString(str);

  const functionReplaceMatch = (str, search, substitute, type) => {
    const indexMatch = packs[type]?.index.find((i) =>
      i.name.toLowerCase() === search.toLowerCase()
      && i.system?.source?.rules === rules,
    );
    if (indexMatch) {
      const replaceText = `@UUID[${indexMatch.uuid}]{${substitute}}`;
      str = str.replaceAll(search, replaceText);
    } else {
      // these are not always monsters, sometimes they are references to other things like spells, conditions, rules, etc
      // const label = foundry.utils.getProperty(CONFIG.DDBI, `compendium.label.monsters`);
      // const replaceText = `@Compendium[${label}.${match[1]}]{${match[1]}${post}}`;
      str = str.replaceAll(search, `${substitute}`);
    }
    return str;
  };

  // outliers
  // wolf;wolves
  // or swarm of rats;rats
  // surprise;surprised
  // grapple;grappling
  // shape-shifting;shape-shifts
  // red slaad;red slaadi
  // suffocation;suffocating
  // carpet of flying;Carpets of Flying


  const outliers = [
    { lookup: "wolf", linkWord: "wolves", hint: "monsters" },
    { lookup: "swarm of rats", linkWord: "rats", hint: "monsters" },
    // { lookup: "red slaad", linkWord: "red slaadi", hint: "monsters" },
    { lookup: "surprise", linkWord: "surprised", hint: "rules" },
    { lookup: "grapple", linkWord: "grappling", hint: "rules" },
    { lookup: "suffocation", linkWord: "suffocating", hint: "rules" },
    { lookup: "shape-shifting", linkWord: "shape-shifts", hint: "feature" },
    { lookup: "shape-shifting", linkWord: "shape-shift", hint: "feature" },
    { lookup: "fist of Bane;", linkWord: "fists of Bane", hint: "monsters" },
    // { lookup: "priest of osybus", linkWord: "priests of Osybus", hint: "monsters" },
    { lookup: "Necromite of Myrkul", linkWord: "Necromites", hint: "monsters" },
    { lookup: "Skull Lasher of Myrkul", linkWord: "Skull lashers", hint: "monsters" },
    { lookup: "necromancer wizard", linkWord: "necromancer", hint: "monsters" },
    { lookup: "ox", linkWord: "oxen", hint: "monsters" },
    { lookup: "Aurumach Rilmani", linkWord: "aurumachs", hint: "monsters" },
    { lookup: "greater star spawn emissary", linkWord: "greater", hint: "monsters" },
    { lookup: "Swarm of Gremishkas", linkWord: "swarms", hint: "monsters" },
    { lookup: "Magic", linkWord: "Cast a Spell", hunt: "rules" },
    { lookup: "resistance", linkWord: "potion of resistance", hunt: "rules" },


    // master of souls;Masters of Souls
    // Skull Lasher of Myrkul;Skull lashers
    // necromancer wizard;necromancer
    // carpet of flying;Carpets of Flying

  ];

  const outlierMatchResults = [];

  for (const outlier of outliers) {
    const matchRegex = new RegExp(`\\b(${outlier.lookup});(${outlier.linkWord})\\b`, "ig");
    const outlierMatches = [...str.matchAll(matchRegex)];
    outlierMatchResults.push(outlierMatches);
    for (const match of outlierMatches) {
      str = functionReplaceMatch(str, match[0], outlier.linkWord, outlier.hint);
    }
  }

  // examples: Yeti (Chilling Gaze), Vampire (Children of the Night), Necromancer Wizard (Summon Undead).
  const monsterSimpleMatchRegex = /\b(([\w']+)\s*(of|)(\s\w*|)(\s\w*|));(\2(?:s|es|'s|)\s*\3\4(?:s|)\5(?:s|es|'s|i|))\b/ig;
  const matchSimpleAll = [...str.matchAll(monsterSimpleMatchRegex)];
  for (const match of matchSimpleAll) {
    str = functionReplaceMatch(str, match[0], match[6], "monsters");
  }

  // if (!CONFIG.debug.ddbimporter.referenceLinking) return str;
  const finalMatchRegex = /\b(\w+);(\w+)\b/ig;
  const remainingMatches = [...str.matchAll(finalMatchRegex)];
  if (remainingMatches && remainingMatches.length > 0) {
    if (!CONFIG.DDBI.remaining) {
      CONFIG.DDBI.remaining = [];
    }
    CONFIG.DDBI.remaining.push({
      name,
      str,
      remainingMatches,
      matchSimpleAll,
      outlierMatchResults,
    });
  }
  return str;

}
