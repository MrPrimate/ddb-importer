import utils from "./utils.js";
import DDBHelper from "./DDBHelper.js";
import logger from "../logger.js";
import CompendiumHelper from "./CompendiumHelper.js";
import { generateAdventureConfig } from "../muncher/adventure.js";

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
  const featureDef = feature.definition ?? feature;
  const splitMatchAt = match.split("@");
  let result = splitMatchAt[0];
  const classOption = [ddb.character.options.race, ddb.character.options.class, ddb.character.options.feat]
    .flat()
    .find((option) => option.definition.id === featureDef.componentId);
  let linktext = `${result}`;

  // scalevalue
  if (result.includes("scalevalue")) {
    let scaleValue = DDBHelper.getScaleValueString(ddb, feature);
    // if (scaleValue.value.startsWith("@")) scaleValue.value = `[[${scaleValue.value}]]{${scaleValue.name}}`;
    if (scaleValue && scaleValue.value) {
      result = result.replace("scalevalue", scaleValue.value);
      linktext = result.replace("scalevalue", " (Scaled Value) ");
    } else {
      logger.warn("Unable to parse scalevalue", {
        ddb,
        feature: featureDef,
        scaleValue,
      });
    }
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
          return `8 + @abilities.${save}.mod + @prof`;
        });
      const saveRegexp = RegExp(match[0], "g");
      if (saveDCs.length > 1) {
        result = result.replace(saveRegexp, `max(${saveDCs.join(", ")})`);
      } else {
        result = result.replace(saveRegexp, saveDCs[0]);
      }

      linktext = result.replace(saveRegexp, " (Save DC) ");
    });
  }

  // modifier:int@min:1
  // (modifier:cha)+1
  if (result.includes("modifier")) {
    const regexp = /modifier:([a-z]{3})(?:,)?([a-z]{3})?/g;
    // creates array from match groups and dedups
    // const ability = [...new Set(Array.from(result.matchAll(regexp), (m) => m[1]))];
    const matches = [...result.matchAll(regexp)];

    matches.forEach((match) => {
      const mods = match.slice(1);
      const modValues = mods
        .filter((mod) => mod)
        .map((ab) => {
          return ` + @abilities.${ab}.mod`;
        });
      const abRegexp = RegExp(match[0], "g");
      if (modValues.length > 1) {
        result = result.replace(abRegexp, `max(${modValues.join(", ")})`);
        linktext = result.replace(abRegexp, " (Modifier) ");
      } else {
        result = result.replace(abRegexp, modValues[0]);
        linktext = result.replace(abRegexp, ` (${utils.capitalize(modValues[0])} Modifier) `);
      }

    });
  }

  // classlevel*5
  // (classlevel/2)@roundup
  if (result.includes("classlevel")) {
    const cls = featureDef.classId
      ? ddb.character.classes.find((cls) =>
        cls.definition.id == featureDef.classId
        || featureDef.classId === cls.subclassDefinition?.id
      )
      : DDBHelper.findClassByFeatureId(ddb, featureDef.componentId);

    if (cls) {
      const clsLevel = ` + @classes.${cls.definition.name.toLowerCase().replace(" ", "-")}.levels`;
      result = result.replace("classlevel", clsLevel);
      linktext = result.replace("classlevel", ` (${cls.definition.name} Level) `);
    } else if (classOption) {
      // still not found a cls? could be an option
      const optionCls = DDBHelper.findClassByFeatureId(ddb, classOption.componentId);
      if (optionCls) {
        const clsLevel = ` + @classes.${optionCls.definition.name.toLowerCase().replace(" ", "-")}.levels`;
        result = result.replace("classlevel", clsLevel);
        linktext = result.replace("classlevel", ` (${optionCls.definition.name} Level) `);
      } else {
        logger.error(
          `Unable to parse option class info. classOption ComponentId is: ${classOption.componentId}.  ComponentId is ${featureDef.componentId}`
        );
      }
    } else {
      if (!featureDef.componentId) {
        logger.debug("Feature failed componentID parse", featureDef);
      }
      logger.error(`Unable to parse option class info. ComponentId is ${featureDef.componentId}`);
    }
  }

  if (result.includes("characterlevel")) {
    result = result.replace("characterlevel", " + @details.level");
    linktext = result.replace("characterlevel", ` (Character Level) `);
  }

  if (result.includes("proficiency")) {
    result = result.replace("proficiency", " + @prof");
    linktext = result.replace("proficiency", ` (Proficiency Bonus) `);
  }

  // abilityscore:int
  if (result.includes("spellattack")) {
    const regexp = /spellattack:([a-z]{3})/g;
    // creates array from match groups and dedups
    const ability = [...new Set(Array.from(result.matchAll(regexp), (m) => m[1]))];

    ability.forEach((ab) => {
      const abRegexp = RegExp(`spellattack:${ab}`, "g");
      result = result.replace(abRegexp, ` + @abilities.${ab}.mod + @prof + @bonus.rsak.attack`);
      linktext = result.replace(abRegexp, ` (${utils.capitalize(ab)} Spell Attack) `);
    });
  }

  // abilityscore:int
  if (result.includes("abilityscore")) {
    const regexp = /abilityscore:([a-z]{3})/g;
    // creates array from match groups and dedups
    const ability = [...new Set(Array.from(result.matchAll(regexp), (m) => m[1]))];

    ability.forEach((ab) => {
      const abRegexp = RegExp(`abilityscore:${ab}`, "g");
      result = result.replace(abRegexp, ` + @abilities.${ab}.value`);
      linktext = result.replace(abRegexp, ` (${utils.capitalize(ab)} Score) `);
    });
  }

  // limiteduse
  if (result.includes("limiteduse")) {
    const limitedUse = featureDef.limitedUse?.maxUses || "";
    result = result.replace("limiteduse", limitedUse);
    linktext = result.replace("limiteduse", ` (Has limited uses) `);
  }

  if (result.includes("fixedvalue:")) {
    const fvRegexp = /fixedvalue:(\d+)/g;
    result = result.replace(fvRegexp, "$1");
    linktext = result.replace(fvRegexp, "");
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
  }

  const lowerCaseTag = utils.normalizeString(strippedP2);

  const types = [
    CONFIG.DND5E.rules,
    CONFIG.DND5E.conditionTypes,
    CONFIG.DND5E.skills,
    CONFIG.DND5E.abilities,
    CONFIG.DND5E.creatureTypes,
    CONFIG.DND5E.damageTypes,
    CONFIG.DND5E.spellComponents,
    CONFIG.DND5E.spellTags,
    CONFIG.DND5E.spellSchools,
    CONFIG.DND5E.areaTargetTypes,
  ];

  let result = p2;
  for (const type of types) {
    if (type[lowerCaseTag] && type.reference) {
      result = `&Reference[${lowerCaseTag}]{${p2}}`;
      break;
    }
  }

  return result;
}


function parseSRDReferences(text) {
  const types = [
    CONFIG.DND5E.rules,
    CONFIG.DND5E.conditionTypes,
    CONFIG.DND5E.skills,
    CONFIG.DND5E.abilities,
    CONFIG.DND5E.creatureTypes,
    CONFIG.DND5E.damageTypes,
    CONFIG.DND5E.spellComponents,
    CONFIG.DND5E.spellTags,
    CONFIG.DND5E.spellSchools,
    CONFIG.DND5E.areaTargetTypes,
  ];

  for (const type of types) {
    for (const [key, value] of Object.entries(type)) {
      // eslint-disable-next-line no-continue
      if (!value.reference) continue;
      const linkRegEx = new RegExp(`(^| |\\(|\\[|>)(${value.label})( |\\)|\\]|\\.|,|$|\n|<)`, "ig");
      const replaceRule = (match, p1, p2, p3) => {
        return `${p1}&Reference[${key}]{${p2}}${p3}`;
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
  text = parseSRDReferences(text);
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
  const diceMatchRegex = /(?:<strong>)?\+*\s*(\d*d\d\d*\s*\+*)\s*(?:<\/strong>)?\+*\s*\[\[(\/roll)?/g;
  const matches = text.match(diceMatchRegex);
  if (matches) {
    const replaceString = matches[2] ? "[[ $1 + " : "[[/roll $1 + ";
    text = text.replaceAll(diceMatchRegex, replaceString);
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
  const featureDefinition = feature.definition ?? feature;
  if (!text) return text;

  text = text.replace(/\r\n•/g, "</p>\r\n<p>&bull;");
  let result = {
    id: featureDefinition.id,
    entityTypeId: featureDefinition.entityTypeId,
    componentId: featureDefinition.componentId ? featureDefinition.componentId : null,
    componentTypeId: featureDefinition.componentTypeId ? featureDefinition.componentTypeId : null,
    damageTypeId: featureDefinition.damageTypeId ? featureDefinition.damageTypeId : null,
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
