function getCustomName(data, character) {
  const characterValues = character.flags.ddbimporter.dndbeyond.characterValues;
  const customValue = characterValues.filter((value) => value.valueId == data.id && value.valueTypeId == data.entityTypeId);

  if (customValue) {
    const customName = customValue.find((value) => value.typeId == 8);

    if (customName) {
      data.name = customName.vale;
      return customName.value;
    }
    if (customName) return customName.value;
  }
  return null;
}


export function getName(data, character) {
  // spell name
  const customName = getCustomName(data, character);
  if (customName) {
    return customName;
  } else if (data.flags.ddbimporter.dndbeyond.nameOverride !== undefined) {
    return data.flags.ddbimporter.dndbeyond.nameOverride;
  } else {
    return data.definition.name;
  }
}
