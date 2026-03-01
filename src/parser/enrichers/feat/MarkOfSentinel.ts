import Generic from "./Generic";

export default class MarkOfSentinel extends Generic {
  get additionalActivities() {
    return [{
      init: {
        name: `Vigilant Guardian`,
        type: Generic.ACTIVITY_TYPES.UTILITY,
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
