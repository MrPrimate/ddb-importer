import DDBEnricherData from "../data/DDBEnricherData";

export default class FindFamiliar extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      name: "Summon",
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (!["Pact of the Chain"].includes(this.ddbParser.lookupName ?? "")) return [];
    return [
      {
        init: {
          name: "Find Familiar (Expanded Options)",
          type: DDBEnricherData.ACTIVITY_TYPES.SUMMON,
        },
        build: {

        },
        overrides: {
          noTemplate: true,
          func: async ({ activity }) => {
            await this.ddbParser.ddbCompanionFactory?.addCRSummoning(activity);
          },
        },
      },
    ];
  }

}
