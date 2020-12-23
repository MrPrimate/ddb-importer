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
          id: characterClass.definition.id,
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
    const classIds = characterClass.definition.classFeatures
      .map((feature) => feature.id)
      .concat((characterClass.subclassDefinition)
        ? characterClass.subclassDefinition.classFeatures.map((feature) => feature.id)
        : []);

    // const profs = DICTIONARY.character.skills.map((skill) => {
    //   return ddb.character.modifiers.class
    //   .filter((mod) =>
    //     mod.friendlySubtypeName === skill.label &&
    //     classIds.includes(mod.componentId))
    //   .map((f) => skill.name);
    // }).flat();

    const profs = DICTIONARY.character.skills
      .filter((skill) =>
        ddb.character.modifiers.class
          .filter((mod) =>
            mod.friendlySubtypeName === skill.label &&
            classIds.includes(mod.componentId)
          )
      )
      .map((skill) => skill.name);


    item.data.skills = {
      value: profs
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
