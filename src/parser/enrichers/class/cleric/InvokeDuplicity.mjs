/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class InvokeDuplicity extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      targetType: "self",
      activationType: "bonus",
      data: {
        duration: {
          value: "1",
          units: "minute",
        },
      },
    };
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Move Duplicate",
          type: "utility",
        },
        build: {
          generateConsumption: false,
          generateRange: true,
          generateActivation: true,
          activationOverride: {
            type: "bonus",
            value: 1,
            condition: "",
          },
          rangeOverride: {
            units: "ft",
            value: "120",
          },
        },
      },
    ];
  }

  get effects() {
    return [];
  }

}
