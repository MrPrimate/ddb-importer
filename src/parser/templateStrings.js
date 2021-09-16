import utils from "../utils.js";
import logger from "../logger.js";

var srdRules;

export async function loadSRDRules() {
  if (srdRules) return;
  try {
    // eslint-disable-next-line require-atomic-updates
    srdRules = await game.packs.get("dnd5e.rules").getIndex();
  } catch (err) {
    logger.error("5e SRD Rules compendium failed to load");
    // eslint-disable-next-line require-atomic-updates
    srdRules = [];
  }
}

/**
 * Gets the levelscaling value for a feature
 * @param {*} feature
 */
const getScalingValue = (feature) => {
  if (feature && feature.levelScale && feature.levelScale.fixedValue) {
    return feature.levelScale.fixedValue;
  } else if (feature && feature.levelScale && feature.levelScale.dice) {
    return feature.levelScale.dice.diceString;
  } else {
    return "{{scalevalue-unknown}}";
  }
};

/**
 * Parse a match and replace template values ready for evaluation
 * @param {*} ddb
 * @param {*} character
 * @param {*} match
 * @param {*} feature
 */
let parseMatch = (ddb, character, match, feature) => {
  const splitMatchAt = match.split("@");
  let result = splitMatchAt[0];
  const characterAbilities = character.flags.ddbimporter.dndbeyond.effectAbilities;

  // scalevalue
  if (result.includes("scalevalue")) {
    const feat = feature.levelScale ? feature : utils.findComponentByComponentId(ddb, feature.componentId);
    const scaleValue = getScalingValue(feat);
    result = result.replace("scalevalue", scaleValue);
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
          // const bonus = utils.getModifierSum(utils.filterBaseModifiers(ddb, "bonus", "spell-save-dc"), character);
          const dc = 8 + character.data.attributes.prof + abilityModifier;
          return dc;
        });
      const saveRegexp = RegExp(match[0], "g");
      result = result.replace(saveRegexp, Math.max(...saveDCs));
    });
  }

  // modifier:int@min:1
  // (modifier:cha)+1
  if (result.includes("modifier")) {
    const regexp = /modifier:([a-z]{3})/g;
    // creates array from match groups and dedups
    const ability = [...new Set(Array.from(result.matchAll(regexp), (m) => m[1]))];

    ability.forEach((ab) => {
      const abilityModifier = characterAbilities[ab].mod;
      const abRegexp = RegExp(`modifier:${ab}`, "g");
      result = result.replace(abRegexp, abilityModifier);
    });
  }

  // classlevel*5
  // (classlevel/2)@roundup
  if (result.includes("classlevel")) {
    const cls = feature.classId
      ? ddb.character.classes.find((cls) => cls.definition.id == feature.classId)
      : utils.findClassByFeatureId(ddb, feature.componentId);
    if (cls) {
      result = result.replace("classlevel", cls.level);
    } else {
      // still not found a cls? could be an option
      const classOption = [ddb.character.options.race, ddb.character.options.class, ddb.character.options.feat]
        .flat()
        .find((option) => option.definition.id === feature.componentId);
      if (!classOption) {
        if (!feature.componentId) {
          logger.debug("Feature failed componentID parse", feature);
        }
        logger.error(`Unable to parse option class info. ComponentId is ${feature.componentId}`);
      } else {
        const optionCls = utils.findClassByFeatureId(ddb, classOption.componentId);
        if (optionCls) {
          result = result.replace("classlevel", optionCls.level);
        } else {
          logger.error(`Unable to parse option class info. classOption ComponentId is: ${classOption.componentId}.  ComponentId is ${feature.componentId}`);
        }
      }
    }
  }

  if (result.includes("characterlevel")) {
    result = result.replace("characterlevel", character.flags.ddbimporter.dndbeyond.totalLevels);
  }

  if (result.includes("proficiency")) {
    const profBonus = character.data.attributes.prof;
    result = result.replace("proficiency", profBonus);
  }

  // abilityscore:int
  if (result.includes("abilityscore")) {
    const regexp = /abilityscore:([a-z]{3})/g;
    // creates array from match groups and dedups
    const ability = [...new Set(Array.from(result.matchAll(regexp), (m) => m[1]))];

    ability.forEach((ab) => {
      const abilityModifier = characterAbilities[ab].value;
      const abRegexp = RegExp(`abilityscore:${ab}`, "g");
      result = result.replace(abRegexp, abilityModifier);
    });
  }

  // limiteduse
  if (result.includes("limiteduse")) {
    const limitedUse = feature.limitedUse?.maxUses || "";
    result = result.replace("limiteduse", limitedUse);
  }

  return result;
};

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
      if (splitConstraint[1] < result) result = splitConstraint[1];
      break;
    }
    case "min": {
      if (splitConstraint[1] > result) result = splitConstraint[1];
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
      logger.warn(`ddb-importer does not know about template constraint {{@${constraint}}}. Please log a bug.`); // eslint-disable-line no-console
    }
  }

  if (multiConstraint.length > 1) {
    const evalStatement = `${result}*${multiConstraint[1]}`;
    /* eslint-disable no-eval */
    result = eval(evalStatement);
    /* eslint-enable no-eval */
  }

  return result;
};

const escapeRegExp = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
};

const getNumber = (theNumber) => {
  if (theNumber >= 0) {
    return "+" + theNumber;
  } else {
    return theNumber.toString();
  }
};

// eslint-disable-next-line no-unused-vars
function replaceTag(match, p1, p2, p3, offset, string) {
  if (!p2) {
    logger.warn(`Unable to tag parse ${match}`);
    return match;
  }
  const srdMatch = srdRules.find((rule) => rule.name.toLowerCase() === p2.toLowerCase());
  if (srdMatch) {
    return `@Compendium[dnd5e.rules.${srdMatch._id}]{${p2}}`;
  } else {
    logger.info(`Unable to find tag parse compendium match for ${match}`);
  }
  return p2;
}

function parseTags(text) {
  if (!srdRules) return text;
  // older chrome/chromium and electron app do not support replaceAll
  if (typeof text.replaceAll !== "function") {
    return text;
  }
  const tagRegEx = /\[(.*)](.*)\[\/(.*)]/g;
  const matches = text.match(tagRegEx);
  if (matches) {
    return text.replaceAll(tagRegEx, replaceTag);
  }
  return text;
}

/**
 * This will parse a snippet/description with template boilerplate in from DDB.
 * e.g. Each creature in the area must make a DC {{savedc:con}} saving throw.
 * @param {*} ddb
 * @param {*} text
 */
export default function parseTemplateString(ddb, character, text, feature) {
  if (!text) return text;
  let result = {
    id: feature.id,
    entityTypeId: feature.entityTypeId,
    componentId: (feature.componentId) ? feature.componentId : null,
    componentTypeId: (feature.componentTypeId) ? feature.componentTypeId : null,
    damageTypeId: (feature.damageTypeId) ? feature.damageTypeId : null,
    text: text,
    resultString: "",
    definitions: [],
  };

  const regexp = /{{(.*?)}}/g;
  // creates array from match groups and dedups
  const matches = [...new Set(Array.from(result.text.matchAll(regexp), (m) => m[1]))];

  matches.forEach((match) => {
    let entry = {
      parsed: null,
      match: match,
      replacePattern: new RegExp(`{{${escapeRegExp(match)}}}`, "g"),
      type: null,
      subType: null,
    };

    const splitRemoveUnsigned = match.split("#")[0];
    const splitMatchAt = splitRemoveUnsigned.split("@");
    const parsedMatch = parseMatch(ddb, character, splitRemoveUnsigned, feature);
    const dicePattern = /\d*d\d\d*/;
    const typeSplit = splitMatchAt[0].split(':');
    entry.type = typeSplit[0];
    if (typeSplit.length > 1) entry.subType = typeSplit[1];
    // do we have a dice string, e.g. sneak attack?
    if (parsedMatch.match(dicePattern)) {
      entry.type = "dice";
      entry.parsed = parsedMatch;
      result.text = result.text.replace(entry.replacePattern, entry.parsed);
    } else {
      // we try and eval the expression!
      try {
        /* eslint-disable no-eval */
        // eval is bad, it's quite slow and risky, however it avoids having to write a string parsing engine
        const evalMatch = eval(parsedMatch);
        /* eslint-enable no-eval */
        if (splitMatchAt.length > 1) {
          const constraintAdjusted = applyConstraint(evalMatch, splitMatchAt[1]);
          entry.parsed = getNumber(constraintAdjusted);
        } else {
          entry.parsed = getNumber(evalMatch);
        }
        entry.parsed = entry.parsed.replace("+ +", "+");
        result.text = result.text.replace(entry.replacePattern, entry.parsed);
      } catch (err) {
        result.text = result.text.replace(entry.replacePattern, `{{${match}}}`);
        logger.warn(`ddb-importer does not know about template value {{${match}}}. Please log a bug.`, err);
        logger.warn(err.stack);
      }
    }
    if (entry.parsed) result.resultString += entry.parsed;
    result.definitions.push(entry);
  });

  result.text = result.text.replace("+ +", "+");
  // result.text = await parseTags(result.text);
  result.text = parseTags(result.text);
  character.flags.ddbimporter.dndbeyond.templateStrings.push(result);
  return result;
}
