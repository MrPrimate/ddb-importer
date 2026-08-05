import DDBEnricherData from "../data/DDBEnricherData";

export default class DaywalkerEndureRadiance extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "bonus",
      addItemConsume: true,
      itemConsumeTargetName: "Blood Potency",
    };
  }

  get effects(): IDDBEffectHint[] {
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
