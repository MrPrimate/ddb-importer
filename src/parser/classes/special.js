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

export function classFixes(klass) {
  if (klass.name.startsWith("Order of the Profane Soul")) {
    klass.name = "Order of the Profane Soul";
    const slotsScaleValue = {
      _id: foundry.utils.randomID(),
      type: "ScaleValue",
      configuration: {
        distance: { units: "" },
        identifier: `pact-slots`,
        type: "number",
        scale: {
          "3": {
            "value": 1
          },
          "6": {
            "value": 2
          }
        },
      },
      value: {},
      title: `Pact Slots`,
      icon: null,
    };

    const levelScaleValue = {
      _id: foundry.utils.randomID(),
      type: "ScaleValue",
      configuration: {
        distance: { units: "" },
        identifier: `pact-level`,
        type: "number",
        scale: {
          "3": {
            "value": 1
          },
          "7": {
            "value": 2
          },
          "13": {
            "value": 3
          }
        },
      },
      value: {},
      title: `Pact Level`,
      icon: null,
    };

    klass.system.advancement.push(slotsScaleValue, levelScaleValue);

  }
  return klass;
}
