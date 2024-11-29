/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class GuidedStrike extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      name: "Self",
      targetType: "self",
      activationType: "special",
      activationCondition: "When you miss with an attack",
    };
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Other",
          type: "utility",
        },
        build: {
          generateConsumption: true,
          generateTarget: true,
          generateRange: true,
          generateActivation: true,
          activationOverride: {
            type: "reaction",
            value: 1,
            condition: "",
          },
          targetOverride: {
            affects: {
              type: "ally",
              value: 1,
            },
          },
          rangeOverride: {
            units: "ft",
            value: "30",
          },
        },
      },
    ];
  }

}
