import Generic from "./Generic";

export default class MarkOfSentinel extends Generic {
  get additionalActivities() {
    return [{
      constructor: {
        name: `Vigilant Guardian`,
        type: "utility",
      },
      build: {
        generateDamage: false,
        generateHealing: true,
        generateRange: true,
        generateConsumption: true,
      },
      overrides: {
        targetType: "ally",
        activationType: "reaction",
        data: {
          range: {
            value: 5,
            units: "ft",
          },
        },
      },
    }];

  }

  get addToDefaultAdditionalActivities() {
    return true;
  }
}
