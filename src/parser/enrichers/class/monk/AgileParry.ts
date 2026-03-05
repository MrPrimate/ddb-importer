import DDBEnricherData from "../../data/DDBEnricherData";

export default class AgileParry extends DDBEnricherData {

  get activity(): IDDBActivityData {
    return {
      activationType: "special",
      targetType: "self",
    };
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        options: {
          description: "You gain +2 AC Bonus",
          durationSeconds: 6,
        },
        daeSpecialDurations: ["turnStartSource" as const],
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("2", 20, "system.attributes.ac.bonus"),
        ],
      },
    ];
  }
}
