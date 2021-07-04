/**
 * Generates some meta data for a character to use to determine what to do
 * with a spell.
 * We use this like a quick lookup table
 * @param {*} character
 */
export function getLookups(character) {
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
