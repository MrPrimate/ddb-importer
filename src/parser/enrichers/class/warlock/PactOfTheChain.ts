import DDBEnricherData from "../../data/DDBEnricherData";

export default class PactOfTheChain extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.SUMMON;
  }


  get activity(): IDDBActivityData {
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

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Find Familiar (Expanded Options)",
          type: DDBEnricherData.ACTIVITY_TYPES.SUMMON,
        },
        build: this.is2014
          ? {
            activationOverride: {
              value: 1,
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
