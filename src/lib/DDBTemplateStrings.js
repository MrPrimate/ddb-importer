import utils from "./utils.js";
import DDBHelper from "./DDBHelper.js";
import logger from "../logger.js";
import CompendiumHelper from "./CompendiumHelper.js";
import { generateAdventureConfig } from "../muncher/adventure.js";
import SETTINGS from "../settings.js";

const INDEX_COMPENDIUMS = [
  "spell",
  "item",
  "magicitem",
];

function evaluateMath(obj) {
  // eslint-disable-next-line no-new-func
  return Function('"use strict";return ' + obj.replace(/\+\s*\+/g, "+"))();
}

export async function loadDDBCompendiumIndexes() {
  for (const i of INDEX_COMPENDIUMS) {
    // eslint-disable-next-line no-await-in-loop
    await CompendiumHelper.loadCompendiumIndex(i);
  }
}

export async function loadSRDRules() {
  if (hasProperty(CONFIG, "DDBI.SRD_LOOKUP.index")) return;
  try {
    // eslint-disable-next-line require-atomic-updates
    CONFIG.DDBI.SRD_LOOKUP = await generateAdventureConfig(false, false, true);
    // eslint-disable-next-line require-atomic-updates
    CONFIG.DDBI.SRD_LOOKUP.linkMap = {};
    for (const [key, value] of Object.entries(CONFIG.DDBI.SRD_LOOKUP.lookups)) {
      value.forEach((thing) => {
        thing.type = key;
        CONFIG.DDBI.SRD_LOOKUP.linkMap[thing.name] = thing;
      });
    }
  } catch (err) {
    logger.error("5e SRD Rules compendium failed to load", err);
    // eslint-disable-next-line require-atomic-updates
    // setProperty(CONFIG, "DDBI.SRD_LOOKUP.index", {});
  }
}

export async function importCacheLoad() {
  await loadDDBCompendiumIndexes();
  await loadSRDRules();
}

/**
 * Parse a match and replace template values ready for evaluation
 * @param {*} ddb
 * @param {*} character
 * @param {*} match
 * @param {*} feature
 */
// eslint-disable-next-line complexity
function parseMatch(ddb, character, match, feature) {
  const useScaleAll = foundry.utils.isNewerVersion(game.system.version, "2.0.3");
  const splitMatchAt = match.split("@");
  let result = splitMatchAt[0];
  const characterAbilities = character.flags.ddbimporter.dndbeyond.effectAbilities;
  const classOption = [ddb.character.options.race, ddb.character.options.class, ddb.character.options.feat]
    .flat()
    .find((option) => option.definition.id === feature.componentId);
  let linktext = `${result}`;

  // scalevalue
  if (result.includes("scalevalue")) {
    let scaleValue = DDBHelper.getScaleValueString(ddb, feature);
    // if (scaleValue.value.startsWith("@")) scaleValue.value = `[[${scaleValue.value}]]{${scaleValue.name}}`;
    result = result.replace("scalevalue", scaleValue.value);
    linktext = result.replace("scalevalue", " (Scaled Value) ");
  }

  // savedc:int
  // savedc:str,dex
  if (result.includes("savedc")) {
    const regexp = /savedc:([a-z]{3})(?:,)?([a-z]{3})?/g;
    const matches = [...result.matchAll(regexp)];

    matches.forEach((match) => {
      const saves = match.slice(1);
      const saveDCs = saves
        .filter((save) => save)
        .map((save) => {
          const abilityModifier = utils.calculateModifier(characterAbilities[save].value);
          // not sure if we should add this, probably not.
          // const bonus = DDBHelper.getModifierSum(DDBHelper.filterBaseModifiers(ddb, "bonus", "spell-save-dc"), character);
          const dc = 8 + character.system.attributes.prof + abilityModifier;
          return useScaleAll
            ? `8 + @abilities.${save}.mod + @prof`
            : dc;
        });
      const saveRegexp = RegExp(match[0], "g");
      result = result.replace(saveRegexp, useScaleAll ? `max(${saveDCs.join(", ")})` : Math.max(...saveDCs));
      linktext = result.replace(saveRegexp, " (Save DC) ");
    });
  }

  // modifier:int@min:1
  // (modifier:cha)+1
  if (result.includes("modifier")) {
    const regexp = /modifier:([a-z]{3})/g;
    // creates array from match groups and dedups
    const ability = [...new Set(Array.from(result.matchAll(regexp), (m) => m[1]))];

    ability.forEach((ab) => {
      const abilityModifier = useScaleAll ? ` + @abilities.${ab}.mod` : `+ ${characterAbilities[ab].mod}`;
      const abRegexp = RegExp(`modifier:${ab}`, "g");
      result = result.replace(abRegexp, abilityModifier);
      linktext = result.replace(abRegexp, ` (${utils.capitalize(ab)} Modifier) `);
    });
  }

  // classlevel*5
  // (classlevel/2)@roundup
  if (result.includes("classlevel")) {
    const cls = feature.classId
      ? ddb.character.classes.find((cls) => cls.definition.id == feature.classId)
      : DDBHelper.findClassByFeatureId(ddb, feature.componentId);
    if (cls) {
      const clsLevel = useScaleAll ? ` + @classes.${cls.definition.name.toLowerCase().replace(" ", "-")}.levels` : cls.level;
      result = result.replace("classlevel", clsLevel);
      linktext = result.replace("classlevel", ` (${cls.definition.name} Level) `);
    } else if (classOption) {
      // still not found a cls? could be an option
      const optionCls = DDBHelper.findClassByFeatureId(ddb, classOption.componentId);
      if (optionCls) {
        const clsLevel = useScaleAll ? ` + @classes.${optionCls.definition.name.toLowerCase().replace(" ", "-")}.levels` : optionCls.level;
        result = result.replace("classlevel", clsLevel);
        linktext = result.replace("classlevel", ` (${optionCls.definition.name} Level) `);
      } else {
        logger.error(
          `Unable to parse option class info. classOption ComponentId is: ${classOption.componentId}.  ComponentId is ${feature.componentId}`
        );
      }
    } else {
      if (!feature.componentId) {
        logger.debug("Feature failed componentID parse", feature);
      }
      logger.error(`Unable to parse option class info. ComponentId is ${feature.componentId}`);
    }
  }

  if (result.includes("characterlevel")) {
    const characterLevel = useScaleAll ? " + @details.level" : character.flags.ddbimporter.dndbeyond.totalLevels;
    result = result.replace("characterlevel", characterLevel);
    linktext = result.replace("characterlevel", ` (Character Level) `);
  }

  if (result.includes("proficiency")) {
    const profBonus = useScaleAll ? " + @prof" : character.system.attributes.prof;
    result = result.replace("proficiency", profBonus);
    linktext = result.replace("proficiency", ` (Proficiency Bonus) `);
  }

  // abilityscore:int
  if (result.includes("spellattack")) {
    const regexp = /spellattack:([a-z]{3})/g;
    // creates array from match groups and dedups
    const ability = [...new Set(Array.from(result.matchAll(regexp), (m) => m[1]))];

    ability.forEach((ab) => {
      const rollString = useScaleAll
        ? ` + @abilities.${ab}.mod + @prof + @bonus.rsak.attack`
        : `${characterAbilities[ab].mod} + ${character.system.attributes.prof}`;
      const abRegexp = RegExp(`spellattack:${ab}`, "g");
      result = result.replace(abRegexp, rollString);
      linktext = result.replace(abRegexp, ` (${utils.capitalize(ab)} Spell Attack) `);
    });
  }

  // abilityscore:int
  if (result.includes("abilityscore")) {
    const regexp = /abilityscore:([a-z]{3})/g;
    // creates array from match groups and dedups
    const ability = [...new Set(Array.from(result.matchAll(regexp), (m) => m[1]))];

    ability.forEach((ab) => {
      const abilityScore = useScaleAll ? ` + @abilities.${ab}.value` : characterAbilities[ab].value;
      const abRegexp = RegExp(`abilityscore:${ab}`, "g");
      result = result.replace(abRegexp, abilityScore);
      linktext = result.replace(abRegexp, ` (${utils.capitalize(ab)} Score) `);
    });
  }

  // limiteduse
  if (result.includes("limiteduse")) {
    const limitedUse = feature.limitedUse?.maxUses || "";
    result = result.replace("limiteduse", limitedUse);
    linktext = result.replace("limiteduse", ` (Has limited uses) `);
  }

  return {
    parsed: result,
    linktext,
  };
}

/**
 * Apply the expression constraint
 * @param {*} value
 * @param {*} constraint
 */
const applyConstraint = (value, constraint) => {
  // {{(classlevel/2)@rounddown#unsigned}}
  // @ features
  // @roundup
  // @roundown
  // min:1
  // max:3
  const splitConstraint = constraint.split(":");
  const multiConstraint = splitConstraint[0].split("*");
  const match = multiConstraint[0];

  let result = value;

  switch (match) {
    case "max": {
      result = Math.min(splitConstraint[1], result);
      break;
    }
    case "min": {
      result = Math.max(splitConstraint[1], result);
      break;
    }
    case "roundup": {
      result = Math.ceil(result);
      break;
    }
    case "rounddown":
    case "roundown": {
      result = Math.floor(result);
      break;
    }
    default: {
      logger.debug(`Missed match is ${match}`);
      logger.warn(`ddb-importer does not know about template constraint {{@${constraint}}}. Please log a bug.`, { value, constraint });
    }
  }

  if (multiConstraint.length > 1) {
    const evalStatement = `${result}*${multiConstraint[1]}`;
    result = evaluateMath(evalStatement.replace(")", ""));
  }

  if (match == "unsigned") {
    result = `${result}`.trim().replace(/^\+\s*/, "");
  } else if (match == "signed") {
    if (!`${result}`.trim().startsWith("+") && !`${result}`.trim().startsWith("-")) {
      result = `+ ${result}`;
    }
  }

  return result;
};


/**
 * Apply the expression constraint
 * @param {*} result
 * @param {*} constraint
 */
const addConstraintEvaluations = (value, constraintList) => {
  let result = `${value}`;

  // {{@rounddown,max:9}}
  // {{(classlevel/2)@rounddown#unsigned}}
  // @ features
  // @roundup
  // @roundown
  // min:1
  // max:3
  constraintList.split(",").forEach((constraint) => {
    const splitConstraint = constraint.split(":");
    const multiConstraint = splitConstraint[0].split("*");
    const match = multiConstraint[0];

    switch (match) {
      case "max": {
        result = `min(${result}, ${splitConstraint[1]})`;
        break;
      }
      case "min": {
        result = `max(${result}, ${splitConstraint[1]})`;
        break;
      }
      case "roundup": {
        result = `ceil(${result})`;
        break;
      }
      case "rounddown":
      case "roundown": {
        result = `floor(${result})`;
        break;
      }
      default: {
        logger.debug(`Missed match is ${match}`);
        logger.warn(`ddb-importer does not know about template constraint {{@${constraint}}}. Please log a bug.`, { value, constraint });
      }
    }

    if (multiConstraint.length > 1) {
      result = `${result}*${multiConstraint[1].replace(")", "")}`;
    }
  });

  if (typeof result === 'string') result = result.trim().replace(/^\+\s*/, "");

  return result;
};

const escapeRegExp = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
};

const getNumber = (theNumber, signed) => {
  if (signed == "unsigned") {
    theNumber = `${theNumber}`.trim().replace(/^\+\s*/, "");
  } else if (signed == "signed" && !`${theNumber}`.trim().startsWith("+") && !`${theNumber}`.trim().startsWith("-")) {
    theNumber = `+ ${theNumber}`;
  }

  return theNumber.toString();
};

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

// eslint-disable-next-line no-unused-vars
function replaceTag(match, p1, p2, p3, offset, string) {
  if (!p2) {
    logger.warn(`Unable to tag parse ${match}`);
    return match;
  }
  const strippedP2 = utils.stripHtml(p2);

  if (INDEX_COMPENDIUMS.includes(p1)) {
    return findMatchingTagInIndex(p1, p2);
  } else if (["total cover", "half cover", "three-quaters cover"].includes(strippedP2.toLowerCase())) {
    const coverMatch = CONFIG.DDBI.SRD_LOOKUP.fullPageMap.find((entry) => entry.name === "Cover");
    if (coverMatch) {
      return `@Compendium[dnd5e.rules.${coverMatch._id}.JournalEntryPage.${coverMatch.pageId}]{${p2}}`;
    }
  } else if (hasProperty(CONFIG.DDBI.SRD_LOOKUP, strippedP2.split(";")[0])) {
    const lookup = getProperty(CONFIG.DDBI.SRD_LOOKUP, strippedP2);
    const pageLink = lookup.pageId ? `.JournalEntryPage.${lookup.pageId}` : "";
    const linkStub = lookup.headerLink ? `#${lookup.headerLink}` : "";
    return `@Compendium[dnd5e.rules.${lookup._id}${pageLink}${linkStub}]{${p2}}`;
  } else {
    const srdMatch = CONFIG.DDBI.SRD_LOOKUP.fullPageMap.find((page) => page.name.toLowerCase() === strippedP2.toLowerCase().split(";")[0]
      || utils.nameString(page.name).toLowerCase() === utils.nameString(strippedP2).toLowerCase().split("ing")[0].split(";")[0]
    );
    if (srdMatch) {
      const pageLink = srdMatch.pageId ? `.JournalEntryPage.${srdMatch.pageId}` : "";
      const linkStub = srdMatch.headerLink ? `#${srdMatch.headerLink}` : "";
      return `@Compendium[dnd5e.rules.${srdMatch._id}${pageLink}${linkStub}]{${p2}}`;
    } else {
      logger.info(`Unable to tag parse compendium match for ${match}`);
    }
  }

  return p2;
}

function parseSRDLinks(text) {
  const useCEToggles = game.settings.get(SETTINGS.MODULE_ID, "use-ce-toggles")
    && game.modules.get("dfreds-convenient-effects")?.active;

  if (!CONFIG.DDBI.SRD_LOOKUP?.lookups) return text;
  [
    CONFIG.DDBI.SRD_LOOKUP.lookups.conditions,
    CONFIG.DDBI.SRD_LOOKUP.lookups.skills,
    CONFIG.DDBI.SRD_LOOKUP.lookups.senses,
    // CONFIG.DDBI.SRD_LOOKUP.lookups.weaponproperties,
  ].concat(useCEToggles ? [] : CONFIG.DDBI.SRD_LOOKUP.lookups.conditions).flat()
    .flat()
    .forEach((entry) => {
      const linkRegEx = new RegExp(`(^| |\\(|\\[|>)(${entry.name})( |\\)|\\]|\\.|,|$|\n|<)`, "ig");
      function replaceRule(match, p1, p2, p3) {
        return `${p1}@Compendium[${entry.compendium}.${entry._id}]{${p2}}${p3}`;
      }
      function replaceCERule(match, p1, p2, p3) {
        return `${p1}@toggleEffect[${entry.name}]${p3}`;
      }

      text = useCEToggles && game.dfreds.effectInterface.findEffectByName(entry.name)
        ? text.replaceAll(linkRegEx, replaceCERule)
        : text.replaceAll(linkRegEx, replaceRule);
    });

  return text;
}

export function parseTags(text) {
  // if (!CONFIG.DDBI.SRD_LOOKUP.index || !CONFIG.DDBI.SRD_LOOKUP.lookups) return text;
  const tagRegEx = /\[([^\]]+)]([^[]+)\[\/([^\]]+)]/g;
  const matches = text.match(tagRegEx);
  if (matches) {
    return text.replaceAll(tagRegEx, replaceTag);
  }
  text = parseSRDLinks(text);
  return text;
}

function replaceRoll(match, p1, p2) {
  if (!p2) {
    logger.warn(`Unable to roll parse ${match}`);
    return match;
  }
  const isRollRegex = /([0-9]*d[0-9]+)|(@scale\.)/g;
  const isRollMatches = p2.match(isRollRegex);
  if (isRollMatches) {
    return match;
  } else if (Number.isInteger(parseInt(p2))) {
    return p2;
  } else {
    const prefix = p2.trim().startsWith("+") ? "+ " : "";
    return `${prefix}[[${p2}]]`;
  }
}

function fixRollables(text) {
  const diceMatchRegex = /<strong>\+*\s*(\d*d\d\d*\s*\+*)\s*<\/strong>\+*\s*\[\[\/roll/g;
  const matches = text.match(diceMatchRegex);
  if (matches) {
    text = text.replaceAll(diceMatchRegex, "[[/roll $1 ");
  }

  const noRollRegex = /(\[\[\/roll)([\w\s.,@\d+-\\*/()]*(?![0-9]*d[0-9]+)(?!@scale\.)[\w\s.,@\d-+\\*/()]*)(\]\])/g;
  // const noRollMatches = text.match(noRollRegex);
  // console.warn("noRollMatches", {text: duplicate(text), noRollMatches});
  text = text.replaceAll(noRollRegex, replaceRoll);

  return text;
}

function rollMatch(text, matchString) {
  const rollMatch = new RegExp(`(?:^|[ "'(+>])(\\d*d\\d\\d*\\s)({{${matchString}}})(?:$|[., "')+<])`, "g");
  return text.replace(rollMatch, (m) => `[[/roll ${m[1] !== undefined ? m[1] : ""}${m[2]}]`);
}

/**
 * This will parse a snippet/description with template boilerplate in from DDB.
 * e.g. Each creature in the area must make a DC {{savedc:con}} saving throw.
 * @param {object} ddb - The ddb object.
 * @param {object} character - The character object.
 * @param {string} text - The template string to parse.
 * @param {object} feature - The feature object.
 * @return {object} - The parsed template string result object.
 */
export default function parseTemplateString(ddb, character, text, feature) {
  if (!text) return text;

  text = text.replace(/\r\n•/g, "</p>\r\n<p>&bull;");
  let result = {
    id: feature.id,
    entityTypeId: feature.entityTypeId,
    componentId: feature.componentId ? feature.componentId : null,
    componentTypeId: feature.componentTypeId ? feature.componentTypeId : null,
    damageTypeId: feature.damageTypeId ? feature.damageTypeId : null,
    text,
    resultStrings: [],
    displayStrings: [],
    definitions: [],
  };

  const regexp = /{{(.*?)}}/g;
  // creates array from match groups and dedups
  const matches = [...new Set(Array.from(result.text.matchAll(regexp), (m) => m[1]))];

  // eslint-disable-next-line complexity
  matches.forEach((match) => {
    let entry = {
      parsed: null,
      match,
      replacePattern: new RegExp(`{{${escapeRegExp(match)}}}`, "g"),
      rollMatch: new RegExp(`(?:^|[ "'(+>])(\\d*d\\d\\d*\\s)({{${match}}})(?:$|[., "')+<])`, "g"),
      rollMatchTest: false,
      type: null,
      subType: null,
    };

    entry.rollMatchTest = entry.rollMatch.test(result.text);

    // console.warn("parseTemplateString", { text: duplicate(text), feature, entry, match, result });

    const splitSignedBase = match.split("#");
    const splitSigned = splitSignedBase.length > 1 && ["signed", "unsigned"].includes(splitSignedBase[1])
      ? splitSignedBase
      : !match.includes("@")
        ? [match.replace("#", "@")]
        : splitSignedBase;
    const splitRemoveUnsigned = splitSigned[0];
    const signed = splitSigned.length > 1
      ? splitSigned[1]
      : match.includes("modifier")
        ? "signed"
        : null;
    const splitMatchAt = splitRemoveUnsigned.split("@");

    // console.warn("splitMatchAt", { splitMatchAt, splitRemoveUnsigned, signed, splitSigned, splitSignedBase, match });

    const parsedMatchData = parseMatch(ddb, character, splitRemoveUnsigned, feature);
    const parsedMatch = parsedMatchData.parsed;
    result.displayStrings.push(parsedMatchData);
    const dicePattern = /\d*d\d\d*/;
    const typeSplit = splitMatchAt[0].split(":");
    entry.type = typeSplit[0];

    if (typeSplit.length > 1) entry.subType = typeSplit[1];
    // do we have a dice string, e.g. sneak attack?
    if (parsedMatch.match(dicePattern) || parsedMatch.includes("@scale")) {
      if (parsedMatch.match(dicePattern)) entry.type = "dice";
      entry.parsed = parsedMatch;
      if (splitMatchAt.length > 1) {
        for (let i = 1; i < splitMatchAt.length; i++) {
          if (splitMatchAt[i].includes(")")) entry.parsed = entry.parsed.replace("(", "");
          entry.parsed = addConstraintEvaluations(entry.parsed, splitMatchAt[i]);
        }
      }
      // console.warn("entry", {
      //   entry,
      //   replacePattern: entry.replacePattern.test(result.text),
      //   match: entry.rollMatch.test(result.text),
      // });
      if (entry.rollMatchTest) {
        entry.parsed = rollMatch(text, entry.parsed);
      } else {
        entry.parsed = `[[/roll ${entry.parsed}]]`;
      }

      result.text = result.text.replace(entry.replacePattern, entry.parsed);
    } else {
      // we try and eval the expression!
      try {
        const openExpression = (parsedMatch.match(/\(/g) || []).length;
        const closeExpression = (parsedMatch.match(/\)/g) || []).length;

        let evalString = parsedMatch;
        if (openExpression != closeExpression) {
          for (let i = 0; i < openExpression - closeExpression; i++) {
            evalString = evalString.replace("(", "").trim();
          }
        }

        for (let start = evalString.startsWith("("), end = evalString.endsWith(")"); start && end; start = evalString.startsWith("("), end = evalString.endsWith(")")) {
          evalString = evalString.replace(/^\(/, "").replace(/\)$/, "");
        }
        entry.evalString = evalString;
        // console.warn("evalString", {
        //   evalString,
        //   splitMatchAt,
        // });
        if (splitMatchAt.length > 1) {
          let evalConstraint = `${evalString}`;
          for (let i = 1; i < splitMatchAt.length; i++) {
            // console.warn(`splitMatch ${i}`, {
            //   evalConstraintPre: `${evalConstraint}`,
            //   matchat: splitMatchAt[i],
            //   isInt: Number.isInteger(Number.parseInt(evalConstraint)),
            // });
            evalConstraint = Number.isInteger(Number.parseInt(evalConstraint)) && !evalConstraint.includes("@")
              ? applyConstraint(evalConstraint, splitMatchAt[i])
              : addConstraintEvaluations(evalConstraint, splitMatchAt[i]);
            // console.warn(`evalConstraint ${i} post`, `${evalConstraint}`);
          }
          // console.warn("evalConstraint", evalConstraint);
          entry.evalConstraint = evalConstraint;
          entry.parsed = getNumber(evalConstraint, signed);
        } else {
          entry.parsed = getNumber(`${evalString}`, signed);
        }
        entry.parsed = entry.parsed.replaceAll("+ +", "+").replaceAll("++", "+").replaceAll("* +", "*");
        const isRoll = entry.rollMatchTest;
        // there are some edge cases here where some template string matches do not get the correct [[]] boxes because
        // they are not all [[/roll ]] boxes
        // I need to move the [[]] box addition to outside this process loop
        if (!isRoll && (/^\+\s/).test(entry.parsed.trim())) {
          entry.parsed = `${entry.parsed.trim().replace(/^\+\s/, "+ [[")}]]`;
        } else if (!isRoll && [undefined, null, "unsigned"].includes(signed)) {
          entry.parsed = `[[${entry.parsed.trim()}]]`;
        } else {
          if (entry.rollMatchTest) {
            entry.parsed = rollMatch(text, entry.parsed);
          } else {
            entry.parsed = `[[${entry.parsed}]]`;
          }
          logger.debug("template string odd match", {
            result,
            entry,
            signed,
            isRoll,
          });
        }
        result.text = result.text.replace(entry.replacePattern, entry.parsed);
      } catch (err) {
        result.text = result.text.replace(entry.replacePattern, `{{${match}}}`);
        logger.warn(`ddb-importer does not know about template value {{${match}}}. Please log a bug.`, err);
        logger.warn(err.stack);
      }
    }
    if (entry.parsed && !entry.parsed.includes("NaN")) result.resultStrings.push(entry.parsed);
    result.definitions.push(entry);
  });

  result.text = fixRollables(result.text);
  result.text = result.text.replace(/\+\s*\+/g, "+").replace(/\+\s*\+/g, "+");
  result.text = result.text.replace(/\+<\/strong>\+/g, "+</strong>");

  result.text = parseTags(result.text);
  character.flags.ddbimporter.dndbeyond.templateStrings.push(result);

  // console.warn(`${feature.name} tempalte`, result);
  return result;
}
