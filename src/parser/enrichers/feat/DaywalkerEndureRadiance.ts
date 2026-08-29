import DDBEnricherData from "../data/DDBEnricherData";

export default class DaywalkerEndureRadiance extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "bonus",
      addItemConsume: true,
      itemConsumeTargetName: "feat:blood-potency",
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Endure Radiance",
        options: {
          durationSeconds: 60,
          description: "Your Vulnerability to Radiant damage is removed for the duration.",
        },
        changes: [
          // Kindred vulnerabilities are Fire and Radiant; override the set to
          // leave only Fire while the effect runs
          DDBEnricherData.ChangeHelper.overrideChange("fire", 20, "system.traits.dv.value"),
        ],
      },
    ];
  }

}
