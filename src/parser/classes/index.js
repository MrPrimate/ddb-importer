import logger from '../../logger.js';
import DICTIONARY from '../../dictionary.js';
import utils from '../../lib/utils.js';
import DDBHelper from "../../lib/DDBHelper.js";
import CompendiumHelper from '../../lib/CompendiumHelper.js';
import { getSpellCastingAbility } from "../spells/ability.js";
import parseTemplateString from "../../lib/DDBTemplateStrings.js";
import { SPECIAL_ADVANCEMENTS, classFixes } from './special.js';

/**
 * Fetches the sources and pages for class and subclass
 * @param {obj} data item
 */
function getSources(data) {
  const classSource = DDBHelper.getSourceData(data.definition);

  let sources = classSource.name;
  if (classSource.page) sources += ` (pg. ${classSource.page})`;

  if (data.subclassDefinition) {
    const subclassSource = DDBHelper.getSourceData(data.subclassDefinition);
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
  // distance, number, dice, anything
  let type = "string";
  const die = feature.levelScales[0]?.dice ? feature.levelScales[0]?.dice : feature.levelScales[0]?.die ? feature.levelScales[0]?.die : undefined;

  if (die?.diceString && (!die.fixedValue || die.fixedValue === "")) {
    type = "dice";
  } else if (feature.levelScales[0].fixedValue
    && feature.levelScales[0].fixedValue !== ""
    && Number.isInteger(feature.levelScales[0].fixedValue)
  ) {
    type = "number";
  }

  const scaleValue = {
    _id: foundry.utils.randomID(),
    type: "ScaleValue",
    configuration: {
      distance: { units: "" },
      identifier: utils.referenceNameString(feature.name).toLowerCase(),
      type,
      scale: {},
    },
    value: {},
    title: feature.name,
    icon: "",
    // classRestriction: "",
  };

  feature.levelScales.forEach((scale) => {
    const die = scale.dice ? scale.dice : scale.die ? scale.die : undefined;
    if (type === "dice") {
      scaleValue.configuration.scale[scale.level] = {
        n: die.diceCount,
        die: die.diceValue,
      };
    } else if (type === "number") {
      scaleValue.configuration.scale[scale.level] = {
        value: scale.fixedValue,
      };
    } else {
      let value = (die.diceString && die.diceString !== "")
        ? die.diceString
        : "";
      if (die.fixedValue && die.fixedValue !== "") {
        value += ` + ${die.fixedValue}`;
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

export function getHPAdvancement(klass, character) {
  // const value = "value": {
  //   "1": "max",
  //   "2": "avg"
  // },
  const value = {};
  if (klass) {
    const rolledHP = getProperty(character, "flags.ddbimporter.rolledHP") ?? false;
    const startingClass = getProperty(klass, "flags.ddbimporter.isStartingClass") === true;
    const useMaxHP = game.settings.get("ddb-importer", "character-update-policy-use-hp-max-for-rolled-hp");
    if (rolledHP && !useMaxHP) {
      const baseHP = getProperty(character, "flags.ddbimporter.baseHitPoints");
      const totalLevels = getProperty(character, "flags.ddbimporter.dndbeyond.totalLevels");
      const hpPerLevel = Math.floor(baseHP / totalLevels);
      const leftOvers = Math.floor(baseHP % totalLevels);

      for (let i = 1; i <= klass.system.levels; i++) {
        value[`${i}`] = i === 1 && startingClass ? (hpPerLevel + leftOvers) : hpPerLevel;
      }
    } else {
      for (let i = 1; i <= klass.system.levels; i++) {
        value[`${i}`] = i === 1 && startingClass ? "max" : "avg";
      }
    };
  }
  return {
    _id: foundry.utils.randomID(),
    type: "HitPoints",
    configuration: {},
    value,
    title: "",
    icon: "",
    classRestriction: "",
  };
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
      !excludedFeatures.includes(feature.definition.id)
      && !excludedIds.includes(feature.definition.id)
      && feature.definition.classId === klassDefinition.id
    )
    .map((feature) => feature.definition);

  return classFeatures.concat(optionFeatures)
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .sort((a, b) => a.requiredLevel - b.requiredLevel);
}

function getFeatureCompendiumMatch(compendium, feature, klassDefinition) {
  return compendium.find((match) =>
    ((hasProperty(match, "flags.ddbimporter.featureName") && feature.name.trim().toLowerCase() == match.flags.ddbimporter.featureName.trim().toLowerCase())
      || (!hasProperty(match, "flags.ddbimporter.featureName")
        && (feature.name.trim().toLowerCase() == match.name.trim().toLowerCase()
        || `${feature.name} (${klassDefinition.name})`.trim().toLowerCase() == match.name.trim().toLowerCase()))
    )
    && hasProperty(match, "flags.ddbimporter")
    && (match.flags.ddbimporter.class == klassDefinition.name
      || match.flags.ddbimporter.parentClassId == klassDefinition.id
      || match.flags.ddbimporter.classId == klassDefinition.id)
  );
}

async function generateFeatureAdvancements(ddb, klass, klassDefinition, compendiumClassFeatures, ignoreIds = []) {
  logger.debug(`Parsing ${klass.name} features for advancement`);
  const compendiumLabel = CompendiumHelper.getCompendiumLabel("features");

  let advancements = [];
  getClassFeatures(ddb, klass, klassDefinition, ignoreIds)
    .filter((feature) => !ignoreIds.includes(feature.id))
    .forEach((feature) => {
      const featureMatch = getFeatureCompendiumMatch(compendiumClassFeatures, feature, klassDefinition);

      if (featureMatch) {
        const levelAdvancement = advancements.findIndex((advancement) => advancement.level === feature.requiredLevel);

        if (levelAdvancement == -1) {
          const advancement = {
            _id: foundry.utils.randomID(),
            type: "ItemGrant",
            configuration: {
              items: [
                `Compendium.${compendiumLabel}.${featureMatch._id}`
              ]
            },
            value: {},
            level: feature.requiredLevel,
            title: "Features",
            icon: "",
            classRestriction: ""
          };
          advancements.push(advancement);
        } else {
          advancements[levelAdvancement].configuration.items.push(`Compendium.${compendiumLabel}.${featureMatch._id}`);
        }
      }
    });

  return advancements;
}

function parseFeaturesForScaleValues(ddb, klass, klassDefinition, ignoreIds = []) {
  let specialFeatures = [];
  const advancements = getClassFeatures(ddb, klass, klassDefinition, ignoreIds)
    .filter((feature) => feature.levelScales?.length > 0)
    .map((feature) => {
      let advancement = generateScaleValueAdvancement(feature);
      const specialLookup = SPECIAL_ADVANCEMENTS[advancement.title];
      if (specialLookup) {
        if (specialLookup.additionalAdvancements) {
          specialLookup.additionalFunctions.forEach((fn) => {
            specialFeatures.push(fn(advancement));
          });
        }
        if (specialLookup.fixFunction) advancement = specialLookup.fixFunction(advancement);
      }
      return advancement;
    });
  return advancements.concat(specialFeatures);
}

export async function addSRDAdvancements(advancements, klass) {
  const rulesCompendium = "dnd5e.classes";
  const srdCompendium = CompendiumHelper.getCompendium(rulesCompendium);
  await srdCompendium.getIndex();
  const klassMatch = srdCompendium.index.find((k) => k.name === klass.name);
  if (klassMatch) {
    const srdKlass = await srdCompendium.getDocument(klassMatch._id);
    const scaleAdvancements = srdKlass.system.advancement.filter((srdA) =>
      srdA.type === "ScaleValue"
      && !advancements.some((ddbA) => ddbA.configuration.identifier === srdA.configuration.identifier)
    ).map((advancement) => {
      return foundry.utils.isNewerVersion(game.system.version, "2.0.3") ? advancement.toObject() : advancement;
    });
    advancements.push(...scaleAdvancements);
  }

  return advancements;
}


async function buildClassFeatures(ddb, klass, klassDefinition, compendiumClassFeatures, ignoreIds = []) {
  logger.debug(`Parsing ${klassDefinition.name} features`);
  let description = "<h1>Class Features</h1>\n\n";
  let classFeatures = [];

  const compendiumLabel = CompendiumHelper.getCompendiumLabel("features");

  getClassFeatures(ddb, klass, klassDefinition, ignoreIds).forEach((feature) => {
    const classFeaturesAdded = classFeatures.some((f) => f === feature.name);

    if (!classFeaturesAdded && !ignoreIds.includes(feature.id)) {
      const featureMatch = getFeatureCompendiumMatch(compendiumClassFeatures, feature, klassDefinition);
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
    system: utils.getTemplate('subclass'),
    flags: {
      ddbimporter: {
        subclassDefinitionId: characterClass.id,
        id: characterClass.subclassDefinition.id,
        type: "class",
      },
      obsidian: {
        source: {
          type: "class",
          text: characterClass.subclassDefinition.name,
        }
      },
    },
  };

  subKlass.system.classIdentifier = utils.referenceNameString(characterClass.definition.name.toLowerCase());
  subKlass.system.identifier = utils.referenceNameString(characterClass.subclassDefinition.name.toLowerCase());

  const castSpells = characterClass.subclassDefinition.canCastSpells;

  if (castSpells) {
    const spellProgression = DICTIONARY.spell.progression.find((cls) => cls.name === characterClass.definition.name);
    const spellCastingAbility = getSpellCastingAbility(characterClass, true, true);
    if (spellProgression) {
      subKlass.system.spellcasting = {
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

  subKlass.system.description.value += "<h1>Description</h1>";
  subKlass.system.description.value += characterClass.subclassDefinition.description;

  const baseClassFeatureIds = characterClass.definition.classFeatures.map((f) => f.id);
  // eslint-disable-next-line no-await-in-loop
  subKlass.system.description.value += await buildClassFeatures(ddb, characterClass, characterClass.subclassDefinition, featuresIndex, baseClassFeatureIds);

  subKlass.system.description.value = parseTemplateString(ddb, character, subKlass.system.description.value, subKlass).text;

  subKlass.system.advancement = [
    ...parseFeaturesForScaleValues(ddb, characterClass, characterClass.subclassDefinition, baseClassFeatureIds),
    ...await generateFeatureAdvancements(ddb, characterClass, characterClass.subclassDefinition, featuresIndex, baseClassFeatureIds),
  ];

  subKlass = classFixes(subKlass);
  return subKlass;
}

export async function getClasses(ddb, character) {
  const featuresCompendium = CompendiumHelper.getCompendiumType("features");
  const featuresIndex = featuresCompendium
    ? await featuresCompendium.getIndex({ fields: ["name", "flags.ddbimporter.classId", "flags.ddbimporter.class", "flags.ddbimporter.subClass", "flags.ddbimporter.parentClassId"] })
    : [];

  let items = [];

  for (const characterClass of ddb.character.classes) {
    let klass = {
      name: characterClass.definition.name,
      type: 'class',
      system: utils.getTemplate('class'),
      flags: {
        ddbimporter: {
          id: characterClass.id,
          definitionId: characterClass.definition.id,
          entityTypeId: characterClass.entityTypeId,
          type: "class",
          isStartingClass: characterClass.isStartingClass,
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
    klass.system.description.value = "<h1>Description</h1>";
    klass.system.description.value += characterClass.definition.description;
    // get class features
    const subClassFeatureIds = characterClass.subclassDefinition && characterClass.subclassDefinition.name
      ? characterClass.subclassDefinition.classFeatures.filter((f) => f.id === characterClass.subclassDefinition.id).map((f) => f.id)
      : [];
    // eslint-disable-next-line no-await-in-loop, require-atomic-updates
    klass.system.description.value += await buildClassFeatures(ddb, characterClass, characterClass.definition, featuresIndex, subClassFeatureIds);

    if (characterClass.definition.equipmentDescription) {
      // eslint-disable-next-line require-atomic-updates
      klass.system.description.value += `<h1>Starting Equipment</h1>\n${characterClass.definition.equipmentDescription}\n\n`;
    }

    klass.system.identifier = utils.referenceNameString(characterClass.definition.name.toLowerCase());
    klass.system.levels = characterClass.level;
    klass.system.source = getSources(characterClass);
    klass.system.hitDice = `d${characterClass.definition.hitDice}`;
    klass.system.hitDiceUsed = characterClass.hitDiceUsed;
    // eslint-disable-next-line no-await-in-loop
    klass.system.advancement = await addSRDAdvancements([
      getHPAdvancement(klass, character),
      ...parseFeaturesForScaleValues(ddb, characterClass, characterClass.definition, subClassFeatureIds),
      // eslint-disable-next-line no-await-in-loop
      ...await generateFeatureAdvancements(ddb, characterClass, characterClass.definition, featuresIndex, subClassFeatureIds),
    ], klass);


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
    // const skillIds = DDBHelper.getChosenClassModifiers(ddb)
    //   .filter((mod) => mod.subType === classSkillSubType && mod.type === "proficiency")
    //   .map((mod) => mod.componentId);

    // "subType": 1,
    // "type": 2,

    // There class object supports skills granted by the class.
    let skillsChosen = [];
    let skillChoices = [];
    const choiceDefinitions = ddb.character.choices.choiceDefinitions;
    ddb.character.choices.class.filter((choice) =>
      classProficiencyFeatureIds.includes(choice.componentId)
      && choice.subType === 1
      && choice.type === 2
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
        DICTIONARY.character.skills.some((skill) => skill.label === option.label)
        && choice.optionIds.includes(option.id)
      ).map((option) =>
        DICTIONARY.character.skills.find((skill) => skill.label === option.label).name
      );
      optionNames.forEach((skill) => {
        if (!skillChoices.includes(skill)) {
          skillChoices.push(skill);
        }
      });
    });

    klass.system.skills = {
      value: skillsChosen,
      number: skillsChosen.length,
      choices: skillChoices,
    };

    klass.system.saves = [];
    DICTIONARY.character.abilities.forEach((ability) => {
      const mods = DDBHelper.getChosenClassModifiers(ddb, true);
      const save = DDBHelper.filterModifiers(mods, "proficiency", `${ability.long}-saving-throws`, [null, ""], true).length > 0;
      if (save) klass.system.saves.push(ability.value);
    });

    const castSpells = characterClass.definition.canCastSpells;

    if (castSpells) {
      const spellProgression = DICTIONARY.spell.progression.find((cls) => cls.name === characterClass.definition.name);
      const spellCastingAbility = getSpellCastingAbility(characterClass, false, false);
      if (spellProgression) {
        klass.system.spellcasting = {
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
      // eslint-disable-next-line no-await-in-loop
      items.push(await parseSubclass(ddb, character, characterClass, featuresIndex));
    }

    klass.system.description.value = parseTemplateString(ddb, character, klass.system.description.value, klass).text;

    klass = classFixes(klass);
    items.push(klass);
  }

  return items;
}
