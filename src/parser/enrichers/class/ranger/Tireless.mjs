/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class Tireless extends DDBEnricherData {
  get type() {
    return "none";
  }

  get additionalActivities() {
    return [
      { action: { name: "Temporary Hit Points", type: "class" } },
      {
        constructor: {
          name: "Reduce Exhaustion",
          type: "utility",
        },
        build: {
          generateConsumption: true,
          generateTarget: true,
          generateActivation: true,
        },
        overrides: {
          targetType: "self",
          activationType: "special",
          condition: "When you finish a short rest",
          addActivityConsume: true,
          additionalConsumptionTargets: [
            {
              type: "attribute",
              value: "1",
              target: "attributes.exhaustion",
              scaling: {
                mode: "",
                formula: "",
              },
            },
          ],
          data: {
            uses: {
              override: true,
              spent: null,
              max: "1",
              recovery: [{ period: "sr", type: "recoverAll", formula: undefined }],
            },
          },
        },
      },
    ];
  }
}
