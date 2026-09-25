import DDBEnricherData from "../data/DDBEnricherData";

/** AU 2024: an hour-long 20-foot cube of shelter; the stick then rests for 1d12 hours. */
export default class ConjurersCanopy extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Raise Canopy",
      targetType: "creature",
      activationType: "action",
      data: {
        duration: { value: "1", units: "hour" },
        target: {
          affects: { type: "creature" },
          template: { type: "cube", size: "20", units: "ft" },
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        duplicate: true,
        id: "ddbCanopyLower01",
        overrides: {
          name: "Lower Canopy (1d12 Hours to Reuse)",
          noTemplate: true,
          targetType: "self",
          data: {
            duration: { value: "", units: "inst" },
            roll: { name: "Hours Before Reuse", formula: "1d12", prompt: false, visible: true },
          },
        },
      },
    ];
  }

}
