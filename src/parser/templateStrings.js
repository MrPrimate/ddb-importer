import utils from "../utils.js";
import logger from "../logger.js";
import { generateAdventureConfig } from "../muncher/adventure.js";
import { loadCompendiumIndex } from "../muncher/utils.js";

const INDEX_COMPENDIUMS = [
  "spell",
  "item",
];

export async function loadDDBCompendiumIndexes() {
  for (const i of INDEX_COMPENDIUMS) {
    // eslint-disable-next-line no-await-in-loop
    await loadCompendiumIndex(i);
  }
}

export async function loadSRDRules() {
  if (hasProperty(CONFIG, "DDBI.SRD_LOOKUP.index")) return;
  try {
    // eslint-disable-next-line require-atomic-updates
    CONFIG.DDBI.SRD_LOOKUP = await generateAdventureConfig(false, false);
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
  const useScale = game.settings.get("ddb-importer", "character-update-policy-use-scalevalue-description");
  const splitMatchAt = match.split("@");
  let result = splitMatchAt[0];
  const characterAbilities = character.flags.ddbimporter.dndbeyond.effectAbilities;
  const classOption = [ddb.character.options.race, ddb.character.options.class, ddb.character.options.feat]
    .flat()
    .find((option) => option.definition.id === feature.componentId);
  let linktext = `${result}`;

  // scalevalue
  if (result.includes("scalevalue")) {
    let scaleValue = utils.getScaleValueString(ddb, feature);
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
          // const bonus = utils.getModifierSum(utils.filterBaseModifiers(ddb, "bonus", "spell-save-dc"), character);
          const dc = 8 + character.data.attributes.prof + abilityModifier;
          return dc;
        });
      const saveRegexp = RegExp(match[0], "g");
      result = result.replace(saveRegexp, Math.max(...saveDCs));
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
      const abilityModifier = useScale ? ` + @abilities.${ab}.mod` : characterAbilities[ab].mod;
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
      : utils.findClassByFeatureId(ddb, feature.componentId);
    if (cls) {
      const clsLevel = useScale ? ` + @classes.${cls.definition.name.toLowerCase()}.level` : cls.level;
      result = result.replace("classlevel", clsLevel);
      linktext = result.replace("classlevel", ` (${cls.definition.name} Level) `);
    } else if (classOption) {
      // still not found a cls? could be an option
      const optionCls = utils.findClassByFeatureId(ddb, classOption.componentId);
      if (optionCls) {
        const clsLevel = useScale ? ` + @classes.${optionCls.definition.name.toLowerCase()}.level` : optionCls.level;
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
    const characterLevel = useScale ? " + @details.level" : character.flags.ddbimporter.dndbeyond.totalLevels;
    result = result.replace("characterlevel", characterLevel);
    linktext = result.replace("characterlevel", ` (Character Level) `);
  }

  if (result.includes("proficiency")) {
    const profBonus = useScale ? " + @prof" : character.data.attributes.prof;
    result = result.replace("proficiency", profBonus);
    linktext = result.replace("proficiency", ` (Proficiency Bonus) `);
  }

  // abilityscore:int
  if (result.includes("spellattack")) {
    const regexp = /spellattack:([a-z]{3})/g;
    // creates array from match groups and dedups
    const ability = [...new Set(Array.from(result.matchAll(regexp), (m) => m[1]))];

    ability.forEach((ab) => {
      const rollString = useScale
        ? ` + @abilities.${ab}.mod + @prof + @bonus.rsak.attack`
        : `${characterAbilities[ab].value} + ${character.data.attributes.prof}`;
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
      const abilityScore = useScale ? ` + @abilities.${ab}.value` : characterAbilities[ab].value;
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


/**
 * Apply the expression constraint
 * @param {*} value
 * @param {*} constraint
 */
const addConstraintEvaluations = (value, constraint) => {
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
      result = `Math.max(${value}, ${splitConstraint[1]})`;
      break;
    }
    case "min": {
      result = `Math.min(${value}, ${splitConstraint[1]})`;
      break;
    }
    case "roundup": {
      result = `Math.ceil(${value})`;
      break;
    }
    case "rounddown":
    case "roundown": {
      result = `Math.floor(${value})`;
      break;
    }
    default: {
      logger.debug(`Missed match is ${match}`);
      logger.warn(`ddb-importer does not know about template constraint {{@${constraint}}}. Please log a bug.`); // eslint-disable-line no-console
    }
  }

  if (multiConstraint.length > 1) {
    result = `${result}*${multiConstraint[1]}`;
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

function findMatchingTagInIndex(type, tag) {
  const index = hasProperty(CONFIG.DDBI, `compendium.index.${type}`)
    ? getProperty(CONFIG.DDBI, `compendium.index.${type}`)
    : undefined;
  if (!index) {
    logger.warn(`Unable to load compendium ${type}s`);
    return tag;
  }
  const match = index.find((entry) => entry.name.replace("’", "'").toLowerCase() === tag.replace("’", "'").toLowerCase());
  if (match) {
    const label = getProperty(CONFIG.DDBI, `compendium.label.${type}`);
    return `@Compendium[${label}.${match._id}]{${tag}}`;
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
  if (INDEX_COMPENDIUMS.includes(p1)) {
    return findMatchingTagInIndex(p1, p2);
  } else if (["total cover", "half cover", "three-quaters cover"].includes(p2.toLowerCase())) {
    const coverMatch = CONFIG.DDBI.SRD_LOOKUP.index.find((entry) => entry.name.toLowerCase() === "cover");
    if (coverMatch) return `@Compendium[dnd5e.rules.${coverMatch._id}]{${p2}}`;
  } else {
    const srdMatch = CONFIG.DDBI.SRD_LOOKUP.index.find((rule) => rule.name.toLowerCase() === p2.toLowerCase() ||
      rule.name.replace("’", "'").toLowerCase() === p2.replace("’", "'").toLowerCase().split("ing")[0]
    );
    if (srdMatch) {
      return `@Compendium[dnd5e.rules.${srdMatch._id}]{${p2}}`;
    } else {
      logger.info(`Unable to find tag parse compendium match for ${match}`);
    }
  }

  return p2;
}

function parseSRDLinks(text) {
  [
    CONFIG.DDBI.SRD_LOOKUP.lookups.conditions,
    CONFIG.DDBI.SRD_LOOKUP.lookups.skills,
    CONFIG.DDBI.SRD_LOOKUP.lookups.senses,
    // CONFIG.DDBI.SRD_LOOKUP.lookups.weaponproperties,
  ]
    .flat()
    .forEach((entry) => {
      const linkRegEx = new RegExp(`(^| |\\(|\\[|>)(${entry.name})( |\\)|\\]|\\.|,|$|\n|<)`, "ig");
      function replaceRule(match, p1, p2, p3) {
        return `${p1}@Compendium[${entry.compendium}.${entry.documentName}]{${p2}}${p3}`;
      }
      text = text.replaceAll(linkRegEx, replaceRule);
    });
  return text;
}

export function parseTags(text) {
  // if (!CONFIG.DDBI.SRD_LOOKUP.index || !CONFIG.DDBI.SRD_LOOKUP.lookups) return text;
  // older chrome/chromium and electron app do not support replaceAll
  if (typeof text.replaceAll !== "function") {
    return text;
  }
  const tagRegEx = /\[([^\]]+)]([^[]+)\[\/([^\]]+)]/g;
  const matches = text.match(tagRegEx);
  if (matches) {
    return text.replaceAll(tagRegEx, replaceTag);
  }
  text = parseSRDLinks(text);
  return text;
}

function fixRollables(text) {
  // older chrome/chromium and electron app do not support replaceAll
  if (typeof text.replaceAll !== "function") {
    return text;
  }
  const diceMatchRegex = /<strong>\+*\s*(\d*d\d\d*)\s*\+*\s*<\/strong>\+*\s*\[\[\/roll/g;
  const matches = text.match(diceMatchRegex);
  if (matches) {
    return text.replaceAll(diceMatchRegex, "[[/roll $1 ");
  }


  // TODO : if [[/roll ]] anddoes not include a dice expression or scale value remove /roll
  const noRollRegex = /(\[\[\/roll)([\w\s.,@\d+\\*/()]+(?![0-9]*d[0-9]+)(?!@scale\.)[\w\s.,@\d+\\*/()]+)(\]\]{Scaled Roll})/g;
  const noRollMatches = text.match(noRollRegex);
  console.warn({text, noRollMatches});
  if (noRollMatches) {
    return text.replaceAll(diceMatchRegex, "[[$2]]");
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

  text = text.replace(/\r\n•/g, "</p>\r\n<p>&bull;");
  let result = {
    id: feature.id,
    entityTypeId: feature.entityTypeId,
    componentId: feature.componentId ? feature.componentId : null,
    componentTypeId: feature.componentTypeId ? feature.componentTypeId : null,
    damageTypeId: feature.damageTypeId ? feature.damageTypeId : null,
    text: text,
    resultString: "",
    displayString: "",
    definitions: [],
  };

  const useScaleText = game.settings.get("ddb-importer", "character-update-policy-use-scalevalue-description")
    ? "{Scaled Roll}"
    : "";
  const fullMatchRegex = /(?:^|[ "'(+>])(\d*d\d\d*\s)?({{.*?}})(?:$|[., "')+<])/g;
  const fullMatches = [...new Set(Array.from(result.text.matchAll(fullMatchRegex), (m) => `${m[1] !== undefined ? m[1] : ""}${m[2]}`))];
  fullMatches.forEach((match) => {
    result.text = result.text.replace(match, `[[/roll ${match}]]${useScaleText}`);
  });

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
    const parsedMatchData = parseMatch(ddb, character, splitRemoveUnsigned, feature);
    const parsedMatch = parsedMatchData.parsed;
    result.displayString += parsedMatchData.displayString;
    const dicePattern = /\d*d\d\d*/;
    const typeSplit = splitMatchAt[0].split(":");
    entry.type = typeSplit[0];
    if (typeSplit.length > 1) entry.subType = typeSplit[1];
    // do we have a dice string, e.g. sneak attack?
    if (parsedMatch.match(dicePattern) || parsedMatch.includes("@")) {
      if (parsedMatch.match(dicePattern)) entry.type = "dice";
      entry.parsed = parsedMatch;
      if (splitMatchAt.length > 1) {
        entry.parsed += ")";
        console.warn("split", splitMatchAt);
        console.warn("parsed", duplicate(entry.parsed));
        for (let i = 1; i < splitMatchAt.length; i++) {
          console.warn(`split match ${i}`, splitMatchAt[i]);
          entry.parsed = addConstraintEvaluations(entry.parsed, splitMatchAt[i]);
        }
      }
      result.text = result.text.replace(entry.replacePattern, entry.parsed);
    } else {
      // we try and eval the expression!
      try {
        /* eslint-disable no-eval */
        // eval is bad, it's quite slow and risky, however it avoids having to write a string parsing engine
        const evalMatch = eval(parsedMatch);
        /* eslint-enable no-eval */
        if (splitMatchAt.length > 1) {
          for (let i = 1; i < splitMatchAt.length; i++) {
            const constraintAdjusted = applyConstraint(evalMatch, splitMatchAt[i]);
            entry.parsed = getNumber(constraintAdjusted);
          }
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

  result.text = fixRollables(result.text);
  result.text = result.text.replace("+ +", "+");
  result.text = result.text.replace("++", "+");
  result.text = result.text.replace("+</strong>+", "+</strong>");

  result.text = parseTags(result.text);
  character.flags.ddbimporter.dndbeyond.templateStrings.push(result);

  return result;
}
