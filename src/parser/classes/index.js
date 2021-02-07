import DICTIONARY from '../../dictionary.js';
import utils from '../../utils.js';

/**
 * Fetches the sources and pages for class and subclass
 * @param {obj} data item
 */
let getSources = (data) => {
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
};

export default function parseClasses(ddb) {
  let items = [];

  ddb.character.classes.forEach((characterClass) => {
    let item = {
      name: characterClass.definition.name,
      type: 'class',
      data: JSON.parse(utils.getTemplate('class')),
      flags: {
        ddbimporter: {
          id: characterClass.id,
          definitionId: characterClass.definition.id,
          entityTypeId: characterClass.entityTypeId,
        },
      },
    };

    item.data.description = {
      value: characterClass.definition.description,
      chat: characterClass.definition.description,
      unidentified: false,
    };
    item.data.levels = characterClass.level;
    item.data.source = getSources(characterClass);

    if (
      characterClass.subclassDefinition &&
      characterClass.subclassDefinition.name
    ) {
      item.data.subclass = characterClass.subclassDefinition.name;

      // update the description
      item.data.description.value +=
        '<p><strong>' + item.data.subclass + '</strong></p>';
      item.data.description.value +=
        characterClass.subclassDefinition.description;
    }

    item.data.hitDice = `d${characterClass.definition.hitDice}`;
    item.data.hitDiceUsed = characterClass.hitDiceUsed;

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

    let skillsChosen = [];
    let skillChoices = [];
    ddb.character.choices.class.filter((choice) =>
      classProficiencyFeatureIds.includes(choice.componentId) &&
      choice.subType === 1 &&
      choice.type === 2
    ).forEach((choice) => {
      const option = choice.options.find((option) => option.id === choice.optionValue);
      if (!option) return;
      const smallChosen = DICTIONARY.character.skills.find((skill) => skill.label === option.label);
      if (smallChosen && !skillsChosen.includes(smallChosen.name)) {
        skillsChosen.push(smallChosen.name);
      }
      const optionNames = choice.options.filter((option) =>
        DICTIONARY.character.skills.some((skill) => skill.label === option.label)
      ).map((option) =>
        DICTIONARY.character.skills.find((skill) => skill.label === option.label).name
      );
      optionNames.forEach((skill) => {
        if (!skillChoices.includes(skill)) {
          skillChoices.push(skill);
        }
      });
    });

    item.data.skills = {
      value: skillsChosen,
      number: skillsChosen.length,
      choices: skillChoices,
    };

    const castSpells = (characterClass.definition.canCastSpells ||
      (characterClass.subclassDefinition && characterClass.subclassDefinition.canCastSpells));

    let spellcasting = "";
    if (castSpells) {
      const spellProgression = DICTIONARY.spell.progression.find((cls) => cls.name === characterClass.definition.name);
      if (spellProgression) spellcasting = spellProgression.value;
    }
    item.data.spellcasting = spellcasting;

    items.push(item);
  });

  return items;
}
