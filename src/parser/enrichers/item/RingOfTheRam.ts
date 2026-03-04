import DDBEnricherData from "../data/DDBEnricherData";

export default class RingOfTheRam extends DDBEnricherData {
  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Break Object",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateTarget: true,
          generateRange: true,
          generateActivation: true,
          generateRoll: true,
          generateConsumption: true,
          rollOverride: {
            name: "Strength Check",
            formula: "1d20 + @scaling * 5",
          },
        },
        overrides: {
          addScalingMode: "amount",
          addConsumptionScalingMax: "3",
        },
      },
    ];
  }
}
