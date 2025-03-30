/**
 * Generates some meta data for a character to use to determine what to do
 * with a spell.
 * We use this like a quick lookup table
 *
 * @param {object} ddb The ddb object containing detailed attributes.
 * @returns {object} lookups - An object containing categorized lists of character data:
 *   - race: Array of objects with race traits, each including `id` and `name`.
 *   - feat: Array of objects with feats, each including `id`, `name`, and `componentId`.
 *   - class: Array of objects with class and subclass information, each including `id` and `name`.
 *   - classFeature: Array of objects with class features, each including `id`, `name`, `classId`, and `componentId`.
 *   - item: Array of objects with inventory items, each including properties such as `id`, `name`, `limitedUse`, `equipped`, `isAttuned`, `canAttune`, and `canEquip`.
 */
export function getLookups(ddb) {
  const character = ddb.character;
  // racialTraits
  let lookups = {
    race: [],
    feat: [],
    class: [],
    classFeature: [],
    item: [],
  };
  character.race.racialTraits.forEach((trait) => {
    lookups.race.push({
      id: trait.definition.id,
      name: trait.definition.name,
    });
  });

  character.classes.forEach((playerClass) => {
    lookups.class.push({
      id: playerClass.definition.id,
      name: playerClass.definition.name,
    });

    if (playerClass.subclassDefinition) {
      lookups.class.push({
        id: playerClass.subclassDefinition.id,
        name: playerClass.subclassDefinition.name,
      });
      for (const option of ddb.classOptions) {
        if (option.classId === playerClass.subclassDefinition.id) {
          lookups.classFeature.push({
            id: option.id,
            name: option.name,
            classId: playerClass.subclassDefinition.id,
          });
        }
      }
    }

    if (playerClass.classFeatures) {
      playerClass.classFeatures.forEach((trait) => {
        lookups.classFeature.push({
          id: trait.definition.id,
          name: trait.definition.name,
          classId: trait.definition.classId,
          componentId: trait.definition.componentId,
        });
      });
    }

    for (const option of ddb.classOptions) {
      if (option.classId === playerClass.definition.id) {
        lookups.classFeature.push({
          id: option.id,
          name: option.name,
          classId: playerClass.definition.id,
        });
      }
    }
  });

  character.options.class.forEach((trait) => {
    lookups.classFeature.push({
      id: trait.definition.id,
      name: trait.definition.name,
      componentId: trait.componentId,
    });
  });

  character.feats.forEach((trait) => {
    lookups.feat.push({
      id: trait.definition.id,
      name: trait.definition.name,
      componentId: trait.componentId,
    });
  });

  character.inventory.forEach((trait) => {
    lookups.item.push({
      id: trait.definition.id,
      name: trait.definition.name,
      limitedUse: trait.limitedUse,
      equipped: trait.equipped,
      isAttuned: trait.isAttuned,
      canAttune: trait.definition.canAttune,
      canEquip: trait.definition.canEquip,
    });
  });

  return lookups;
}
