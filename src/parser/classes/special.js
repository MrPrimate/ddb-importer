function convertToSingularDie(advancement) {
  advancement.title += ` (Die)`;
  for (const key of Object.keys(advancement.configuration.scale)) {
    advancement.configuration.scale[key].n = 1;
  }
  return advancement;
}

function renameTotal(advancement) {
  advancement.title += ` (Total)`;
  return advancement;
}

function addAdditionalUses (advancement) {
  const scaleValue = {
    _id: foundry.utils.randomID(),
    type: "ScaleValue",
    configuration: {
      distance: { units: "" },
      identifier: `${advancement.configuration.identifier}-uses`,
      type: "number",
      scale: {},
    },
    value: {},
    title: `${advancement.title} (Uses)`,
    icon: "",
  };

  for (const [key, value] of Object.entries(advancement.configuration.scale)) {
    scaleValue.configuration.scale[key] = {
      value: value.n,
    };
  }

  return scaleValue;
}

function addSingularDie (advancement) {
  const scaleValue = convertToSingularDie(duplicate(advancement));

  scaleValue._id = foundry.utils.randomID();
  scaleValue.configuration.identifier = `${advancement.configuration.identifier}-die`;

  return scaleValue;
}

export const SPECIAL_ADVANCEMENTS = {
  "Combat Superiority": {
    fix: true,
    fixFunction: renameTotal,
    additionalAdvancements: true,
    additionalFunctions: [addAdditionalUses, addSingularDie],
  },
  "Rune Carver": {
    fix: true,
    fixFunction: renameTotal,
    additionalAdvancements: false,
    additionalFunctions: [],
  },
};
