import DDBEnricherData from "../data/DDBEnricherData";

export default class Maze extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      name: "Cast",
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Check",
          type: DDBEnricherData.ACTIVITY_TYPES.CHECK,
        },
        build: {
          generateDuration: true,
          durationOverride: { units: "inst", concentration: false },
          generateCheck: true,
          noSpellslot: true,
        },
        overrides: {
          data: {
            check: {
              ability: "int",
              dc: {
                formula: "20",
                calculation: "",
              },
            },
          },
        },
      },
    ];
  }

}
