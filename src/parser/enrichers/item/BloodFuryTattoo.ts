import DDBEnricherData from "../data/DDBEnricherData";

export default class BloodFuryTattoo extends DDBEnricherData {

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
        init: {
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
