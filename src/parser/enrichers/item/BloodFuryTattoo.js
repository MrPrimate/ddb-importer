/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../DDBEnricherMixin.js";

export default class BloodFuryTattoo extends DDBEnricherMixin {

  get type() {
    return "damage";
  }

  get activity() {
    return {
      type: "damage",
      addItemConsume: true,
    };
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Reactive Strike",
          type: "utility",
        },
        build: {
          generateTarget: false,
          generateRange: false,
          generateActivation: true,
          activationOverride: {
            type: "reaction",
            value: 1,
            condition: "",
          },
        },
        overrides: {
          addItemConsume: true,
        },
      },
    ];
  }

}
