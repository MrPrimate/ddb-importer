import DDBEnricherData from "../data/DDBEnricherData";

/** AU 2024: the doll levitates within 30 feet for a minute and can be moved or dismissed. */
export default class SpellSlingersPuppet extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Levitate Doll",
      targetType: "space",
      activationType: "bonus",
      noTemplate: true,
      data: {
        range: { value: "30", units: "ft" },
        duration: { value: "1", units: "minute" },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        duplicate: true,
        id: "ddbPuppetMove001",
        overrides: {
          name: "Move Doll",
          data: { duration: { value: "", units: "inst" } },
        },
      },
      {
        duplicate: true,
        id: "ddbPuppetEnd0001",
        overrides: {
          name: "End Levitation",
          targetType: "self",
          data: { duration: { value: "", units: "inst" }, range: { value: null, units: "self" } },
        },
      },
    ];
  }

}
