import DDBEnricherData from "../../data/DDBEnricherData";

export default class InvokeDuplicity extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.SUMMON;
  }

  get summonsFunction() {
    return DDBImporter.lib.DDBSummonsInterface.getDuplicate;
  }

  get generateSummons() {
    return true;
  }

  get activity() {
    return {
      noTemplate: true,
      profileKeys: [
        { count: 1, name: "IllusionaryDuplicate" },
      ],
      targetType: "self",
      activationType: "bonus",
      data: {
        duration: {
          value: "1",
          units: "minute",
        },
        creatureSizes: ["sm", "med", "tiny"],
      },
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Move Duplicate",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
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
