import DDBEnricherData from "../data/DDBEnricherData";

export default class FindFamiliar extends DDBEnricherData {

  get activity() {
    return {
      name: "Summon",
    };
  }

  get additionalActivities() {
    if (!["Pact of the Chain"].includes(this.ddbParser.lookupName)) return [];
    return [
      {
        constructor: {
          name: "Find Familiar (Expanded Options)",
          type: "summon",
        },
        build: {

        },
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
