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

export async function buildClassFeatures(klass, compendiumClassFeatures, ignoreIds = []) {
  logger.debug(`Parsing ${klass.name} features`);
  let description = "<h3>Class Features</h3>\n\n";
  let classFeatures = [];

  const compendiumLabel = getCompendiumLabel("features");

  klass.classFeatures.forEach((feature) => {
    const classFeaturesAdded = classFeatures.some((f) => f === feature.name);

    // sort by level?
    if (!classFeaturesAdded && !ignoreIds.includes(feature.id)) {
      const featureMatch = compendiumClassFeatures.find((match) =>
        feature.name.trim().toLowerCase() == match.name.trim().toLowerCase() &&
        match.flags.ddbimporter &&
        (match.flags.ddbimporter.class == klass.name ||
          match.flags.ddbimporter.parentClassId == klass.id ||
          match.flags.ddbimporter.classId == klass.id)
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

  subKlass.data.description.value += "<h3>Description</h3>";
  subKlass.data.description.value += characterClass.subclassDefinition.description;

  const ignoreIds = characterClass.definition.classFeatures.map((f) => f.id);
  // eslint-disable-next-line no-await-in-loop
  subKlass.data.description.value += await buildClassFeatures(characterClass.subclassDefinition, featuresIndex, ignoreIds);

  subKlass.data.description.value = parseTemplateString(ddb, character, subKlass.data.description.value, subKlass).text;

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
    klass.data.description.value = "<h3>Description</h3>";
    klass.data.description.value += characterClass.definition.description;
    // eslint-disable-next-line no-await-in-loop, require-atomic-updates
    klass.data.description.value += await buildClassFeatures(characterClass.definition, featuresIndex);

    if (characterClass.definition.equipmentDescription) {
      // eslint-disable-next-line require-atomic-updates
      klass.data.description.value += `<p><b>Starting Equipment</b></p>\n${characterClass.definition.equipmentDescription}\n\n`;
    }

    klass.data.identifier = characterClass.definition.name.toLowerCase().replace(/\s|'|’/g, '-');
    klass.data.levels = characterClass.level;
    klass.data.source = getSources(characterClass);
    klass.data.hitDice = `d${characterClass.definition.hitDice}`;
    klass.data.hitDiceUsed = characterClass.hitDiceUsed;

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
