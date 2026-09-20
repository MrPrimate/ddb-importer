import DDBEnricherData from "../data/DDBEnricherData";

/** AU 2024: the broom sweeps a 20-foot square within 60 feet until told to stop. */
export default class SweepingBroom extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Animate Broom",
      targetType: "space",
      activationType: "action",
      data: {
        range: { value: "60", units: "ft" },
        target: {
          affects: { type: "" },
          template: { type: "square", size: "20", units: "ft" },
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        duplicate: true,
        id: "ddbBroomStop0001",
        overrides: {
          name: "Deactivate Broom",
          noTemplate: true,
          targetType: "self",
          data: { range: { value: null, units: "self" } },
        },
      },
    ];
  }

}
