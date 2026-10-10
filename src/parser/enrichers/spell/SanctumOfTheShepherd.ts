import DDBEnricherData from "../data/DDBEnricherData";

export default class SanctumOfTheShepherd extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Sanctum of the Shepherd",
        options: {
          durationSeconds: 86400,
          description: "Apply to the chosen creatures that finish a Long Rest in the Sphere. They gain a +1 bonus to AC for the remainder of the duration.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "system.attributes.ac.bonus"),
        ],
      },
    ];
  }

}
