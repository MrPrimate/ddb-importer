/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class PactOfTheChain extends DDBEnricherData {

  get type() {
    return "summon";
  }


  get activity() {
    return {
      name: "Summon",
      data: this.is2014
        ? {
          activation: {
            value: "1",
            type: "hour",
          },
        }
        : { },
    };
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Find Familiar (Expanded Options)",
          type: "summon",
        },
        build: this.is2014
          ? {
            activationOverride: {
              value: "1",
              type: "hour",
            },
          }
          : {},
        overrides: {
          noTemplate: true,
          func: async ({ activity }) => {
            await this.ddbParser.ddbCompanionFactory.addCRSummoning(activity);
          },
        },
      },
    ];
  }

}
