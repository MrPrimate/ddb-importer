import DDBEnricherData from "../data/DDBEnricherData";

/** AU 2024: orient the needle to the current location, or clear the orientation. */
export default class HomewardCompass extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Orient Compass",
      targetType: "self",
      activationType: "action",
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        duplicate: true,
        id: "ddbCompassEnd001",
        overrides: { name: "End Orientation" },
      },
    ];
  }

}
