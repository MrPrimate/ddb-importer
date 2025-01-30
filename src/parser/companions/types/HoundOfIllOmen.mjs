export function getHoundOfIllOmen(direWolf, version) {
  const results = {};

  if (direWolf) {
    results["HoundOfIllOmen"] = {
      name: "Hound of Ill Omen",
      version: `${version}`,
      required: null,
      isJB2A: false,
      needsJB2A: false,
      needsJB2APatreon: false,
      folderName: "Shadow Sorcerer",
      data: foundry.utils.mergeObject(direWolf.toObject(), {
        "name": "Hound of Ill Omen",
        "prototypeToken": {
          name: "Hound of Ill Omen",
          width: 1,
          height: 1,
        },
        "prototypeToken.name": "Hound of Ill Omen",
        "system.traits.size": "med",
      }),
    };
  }

  return results;

}
