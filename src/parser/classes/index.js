import logger from '../../logger.js';
import DICTIONARY from '../../dictionary.js';
import { getCompendiumType, getCompendiumLabel } from '../../muncher/utils.js';
import utils from '../../utils.js';
import { getSpellCastingAbility } from "../spells/ability.js";
import parseTemplateString from "../templateStrings.js";

/**
 * Fetches the sources and pages for class and subclass
 * @param {obj} data item
 */
function getSources(data) {
  const classSource = utils.getSourceData(data.definition);

  let sources = classSource.name;
  if (classSource.page) sources += ` (pg. ${classSource.page})`;

  if (data.subclassDefinition) {
    const subclassSource = utils.getSourceData(data.subclassDefinition);
    if (subclassSource.name && classSource.name !== subclassSource.name) {
      sources += `, ${subclassSource.name}`;
    }
    if (subclassSource.page && classSource.page !== subclassSource.page) {
      sources += ` (pg. ${subclassSource.page})`;
    }
  }

  return sources;
}

function generateScaleValueAdvancement(feature) {
  // distance, numeric, dice, anything
  let type = "string";

  if (feature.levelScales[0].dice.diceString &&
    (!feature.levelScales[0].dice.fixedValue || feature.levelScales[0].dice.fixedValue === "")
  ) {
    type = "dice";
  } else if (feature.levelScales[0].fixedValue &&
    feature.levelScales[0].fixedValue !== "" &&
    Number.isInteger(feature.levelScales[0].fixedValue)
  ) {
    type = "numeric";
  }

  const scaleValue = {
    type: "ScaleValue",
    configuration: {
      identifier: feature.name.toLowerCase().replace(/\s|'|’/g, '-'),
      type,
      scale: {},
    },
    value: {},
    title: feature.name,
    icon: "",
    classRestriction: "",
  };

  feature.levelScales.forEach((scale) => {
    if (type === "dice") {
      scaleValue.configuration.scale[scale.level] = {
        n: scale.dice.diceCount,
        die: scale.dice.diceValue,
      };
    } else if (type === "numeric") {
      scaleValue.configuration.scale[scale.level] = {
        value: scale.fixedValue,
      };
    } else {
      let value = (scale.dice.diceString && scale.dice.diceString !== "")
        ? scale.dice.diceString
        : "";
      if (scale.dice.fixedValue && scale.dice.fixedValue !== "") {
        value += ` + ${scale.dice.fixedValue}`;
      }
      if (value === "") {
        value = scale.description;
      }
      scaleValue.configuration.scale[scale.level] = {
        value,
      };
    }
  });

  return scaleValue;
}

function getClassFeatures(ddb, klass, klassDefinition, excludedIds = []) {
  const excludedFeatures = ddb.character.optionalClassFeatures
    .filter((f) => f.affectedClassFeatureId)
    .map((f) => f.affectedClassFeatureId);

  const optionFeatures = ddb.classOptions
    ? ddb.classOptions
      .filter((feature) => feature.classId === klassDefinition.id && !excludedIds.includes(feature.id))
    : [];

  const classFeatures = klass.classFeatures
    .filter((feature) =>
      !excludedFeatures.includes(feature.definition.id) &&
      !excludedIds.includes(feature.definition.id) &&
      feature.definition.classId === klassDefinition.id
    )
    .map((feature) => feature.definition);

  return classFeatures.concat(optionFeatures)
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .sort((a, b) => a.requiredLevel - b.requiredLevel);
}

function parseFeaturesForScaleValues(ddb, klass, klassDefinition, ignoreIds = []) {
  const advancements = getClassFeatures(ddb, klass, klassDefinition, ignoreIds)
    .filter((feature) => feature.levelScales?.length > 0)
    .map((feature) => {
      return generateScaleValueAdvancement(feature);
    });
  return advancements;
}


async function buildClassFeatures(ddb, klass, klassDefinition, compendiumClassFeatures, ignoreIds = []) {
  logger.debug(`Parsing ${klass.name} features`);
  let description = "<h1>Class Features</h1>\n\n";
  let classFeatures = [];

  const compendiumLabel = getCompendiumLabel("features");

  console.warn(compendiumClassFeatures);

  getClassFeatures(ddb, klass, klassDefinition, ignoreIds).forEach((feature) => {
    const classFeaturesAdded = classFeatures.some((f) => f === feature.name);

    if (!classFeaturesAdded && !ignoreIds.includes(feature.id)) {
      const featureMatch = compendiumClassFeatures.find((match) =>
        (feature.name.trim().toLowerCase() == match.name.trim().toLowerCase() ||
        `${feature.name} (${klassDefinition.name})`.trim().toLowerCase() == match.name.trim().toLowerCase()) &&
        hasProperty(match, "flags.ddbimporter") &&
        (match.flags.ddbimporter.class == klassDefinition.name ||
          match.flags.ddbimporter.parentClassId == klassDefinition.id ||
          match.flags.ddbimporter.classId == klassDefinition.id)
      );
      const title = (featureMatch)
        ? `<p><b>@Compendium[${compendiumLabel}.${featureMatch._id}]{${feature.name}}</b></p>`
        : `<p><b>${feature.name}</b></p>`;

      // eslint-disable-next-line require-atomic-updates
      description += `${title}\n${feature.description}\n\n`;
      classFeatures.push(feature.name);
    }

  });

  return description;
}


async function parseSubclass(ddb, character, characterClass, featuresIndex) {
  let subKlass = {
    name: characterClass.subclassDefinition.name,
    type: 'subclass',
    data: JSON.parse(utils.getTemplate('subclass')),
    flags: {
      ddbimporter: {
        subclassDefinitionId: characterClass.id,
        id: characterClass.subclassDefinition.id
      },
      obsidian: {
        source: {
          type: "class",
          text: characterClass.subclassDefinition.name,
        }
      },
    },
  };

  subKlass.data.classIdentifier = characterClass.definition.name.toLowerCase().replace(/\s|'|’/g, '-');
  subKlass.data.identifier = characterClass.subclassDefinition.name.toLowerCase().replace(/\s|'|’/g, '-');

  const castSpells = characterClass.subclassDefinition.canCastSpells;

  if (castSpells) {
    const spellProgression = DICTIONARY.spell.progression.find((cls) => cls.name === characterClass.definition.name);
    const spellCastingAbility = getSpellCastingAbility(characterClass, true, true);
    if (spellProgression) {
      subKlass.data.spellcasting = {
        progression: spellProgression.value,
        ability: spellCastingAbility,
      };
    }
    const spellSlotDivisor = characterClass.subclassDefinition.spellRules?.multiClassSpellSlotDivisor
      ? characterClass.subclassDefinition.spellRules?.multiClassSpellSlotDivisor
      : undefined;
    subKlass.flags.ddbimporter.spellSlotDivisor = spellSlotDivisor;
    subKlass.flags.ddbimporter.spellCastingAbility = spellCastingAbility;
  }

  subKlass.data.description.value += "<h1>Description</h1>";
  subKlass.data.description.value += characterClass.subclassDefinition.description;

  const baseClassFeatureIds = characterClass.definition.classFeatures.map((f) => f.id);
  // eslint-disable-next-line no-await-in-loop
  subKlass.data.description.value += await buildClassFeatures(ddb, characterClass, characterClass.subclassDefinition, featuresIndex, baseClassFeatureIds);

  subKlass.data.description.value = parseTemplateString(ddb, character, subKlass.data.description.value, subKlass).text;

  subKlass.data.advancement = parseFeaturesForScaleValues(ddb, characterClass, characterClass.subclassDefinition, baseClassFeatureIds);

  return subKlass;
}

export async function getClasses(ddb, character) {
  const featuresCompendium = getCompendiumType("features");
  const featuresIndex = featuresCompendium
    ? await featuresCompendium.getIndex({ fields: ["name", "flags.ddbimporter.classId", "flags.ddbimporter.class", "flags.ddbimporter.subClass", "flags.ddbimporter.parentClassId"] })
    : [];

  const subClassSupport = utils.versionCompare(game.data.system.data.version, "1.6.0") >= 0;

  let items = [];

  for (const characterClass of ddb.character.classes) {
    let klass = {
      name: characterClass.definition.name,
      type: 'class',
      data: JSON.parse(utils.getTemplate('class')),
      flags: {
        ddbimporter: {
          id: characterClass.id,
          definitionId: characterClass.definition.id,
          entityTypeId: characterClass.entityTypeId,
        },
        obsidian: {
          source: {
            type: "class",
            text: characterClass.definition.name,
          }
        },
      },
    };

    /* eslint-disable require-atomic-updates */
    klass.data.description.value = "<h1>Description</h1>";
    klass.data.description.value += characterClass.definition.description;
    // get class features
    const subClassFeatureIds = characterClass.subclassDefinition && characterClass.subclassDefinition.name
      ? characterClass.subclassDefinition.classFeatures.filter((f) => f.id === characterClass.subclassDefinition.id).map((f) => f.id)
      : [];
    // eslint-disable-next-line no-await-in-loop, require-atomic-updates
    klass.data.description.value += await buildClassFeatures(ddb, characterClass, characterClass.definition, featuresIndex, subClassFeatureIds);

    if (characterClass.definition.equipmentDescription) {
      // eslint-disable-next-line require-atomic-updates
      klass.data.description.value += `<h1>Starting Equipment</h1>\n${characterClass.definition.equipmentDescription}\n\n`;
    }

    klass.data.identifier = characterClass.definition.name.toLowerCase().replace(/\s|'|’/g, '-');
    klass.data.levels = characterClass.level;
    klass.data.source = getSources(characterClass);
    klass.data.hitDice = `d${characterClass.definition.hitDice}`;
    klass.data.hitDiceUsed = characterClass.hitDiceUsed;
    klass.data.advancement = [
      // {
      //   type: "HitPoints",
      //   configuration: {},
      //   value: {},
      //   title: "",
      //   icon: "",
      //   classRestriction: "",
      // },
      // hp should be set like this - we don't actually know in DDB
      // "value": {
      //   "1": "max",
      //   "2": "avg"
      // },
      ...parseFeaturesForScaleValues(ddb, characterClass, characterClass.definition, subClassFeatureIds),
    ];


    // There class object supports skills granted by the class.
    // Lets find and add them for future compatibility.
    // const classFeatureIds = characterClass.definition.classFeatures
    //   .map((feature) => feature.id)
    //   .concat((characterClass.subclassDefinition)
    //     ? characterClass.subclassDefinition.classFeatures.map((feature) => feature.id)
    //     : []);

    const classProficiencyFeatureIds = characterClass.definition.classFeatures
      .filter((feature) => feature.name === "Proficiencies")
      .map((feature) => feature.id)
      .concat((characterClass.subclassDefinition)
        ? characterClass.subclassDefinition.classFeatures
          .filter((feature) => feature.name === "Proficiencies")
          .map((feature) => feature.id)
        : []);

    // const classSkillSubType = `choose-a-${characterClass.definition.name.toLowerCase()}-skill`;
    // const skillIds = utils.getChosenClassModifiers(ddb)
    //   .filter((mod) => mod.subType === classSkillSubType && mod.type === "proficiency")
    //   .map((mod) => mod.componentId);

    // "subType": 1,
    // "type": 2,

    // There class object supports skills granted by the class.
    let skillsChosen = [];
    let skillChoices = [];
    const choiceDefinitions = ddb.character.choices.choiceDefinitions;
    ddb.character.choices.class.filter((choice) =>
      classProficiencyFeatureIds.includes(choice.componentId) &&
      choice.subType === 1 &&
      choice.type === 2
    ).forEach((choice) => {
      const optionChoice = choiceDefinitions.find((selection) => selection.id === `${choice.componentTypeId}-${choice.type}`);
      if (!optionChoice) return;
      const option = optionChoice.options.find((option) => option.id === choice.optionValue);
      if (!option) return;
      const smallChosen = DICTIONARY.character.skills.find((skill) => skill.label === option.label);
      if (smallChosen && !skillsChosen.includes(smallChosen.name)) {
        skillsChosen.push(smallChosen.name);
      }
      const optionNames = optionChoice.options.filter((option) =>
        DICTIONARY.character.skills.some((skill) => skill.label === option.label) &&
        choice.optionIds.includes(option.id)
      ).map((option) =>
        DICTIONARY.character.skills.find((skill) => skill.label === option.label).name
      );
      optionNames.forEach((skill) => {
        if (!skillChoices.includes(skill)) {
          skillChoices.push(skill);
        }
      });
    });

    klass.data.skills = {
      value: skillsChosen,
      number: skillsChosen.length,
      choices: skillChoices,
    };

    klass.data.saves = [];
    DICTIONARY.character.abilities.forEach((ability) => {
      const mods = utils.getChosenClassModifiers(ddb, true);
      const save = utils.filterModifiers(mods, "proficiency", `${ability.long}-saving-throws`, [null, ""], true).length > 0;
      if (save) klass.data.saves.push(ability.value);
    });

    const castSpells = (characterClass.definition.canCastSpells ||
      (!subClassSupport && characterClass.subclassDefinition && characterClass.subclassDefinition.canCastSpells));

    if (castSpells) {
      const spellProgression = DICTIONARY.spell.progression.find((cls) => cls.name === characterClass.definition.name);
      const spellCastingAbility = getSpellCastingAbility(characterClass, !subClassSupport, false);
      if (spellProgression) {
        klass.data.spellcasting = {
          progression: spellProgression.value,
          ability: spellCastingAbility,
        };
      }
      const spellSlotDivisor = characterClass.definition.spellRules?.multiClassSpellSlotDivisor
        ? characterClass.definition.spellRules.multiClassSpellSlotDivisor
        : characterClass.subclassDefinition.spellRules?.multiClassSpellSlotDivisor
          ? characterClass.subclassDefinition.spellRules?.multiClassSpellSlotDivisor
          : undefined;
      klass.flags.ddbimporter.spellSlotDivisor = spellSlotDivisor;
      klass.flags.ddbimporter.spellCastingAbility = spellCastingAbility;
    }

    if (characterClass.subclassDefinition && characterClass.subclassDefinition.name) {
      if (subClassSupport) {
        // eslint-disable-next-line no-await-in-loop
        items.push(await parseSubclass(ddb, character, characterClass, featuresIndex));
      } else {
        klass.data.subclass = characterClass.subclassDefinition.name;
        klass.data.description.value += '<p><strong>' + klass.data.subclass + '</strong></p>';
        klass.data.description.value += characterClass.subclassDefinition.description;
      }
    }

    klass.data.description.value = parseTemplateString(ddb, character, klass.data.description.value, klass).text;

    items.push(klass);
  }

  return items;
}
