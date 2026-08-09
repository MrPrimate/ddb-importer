import DDBEnricherData from "../../data/DDBEnricherData";

export default class AgileParry extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      activationType: "special",
      targetType: "self",
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        options: {
          description: "You gain +2 AC Bonus",
          durationSeconds: 6,
        },
        daeSpecialDurations: ["turnStartSource"],
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("2", 20, "system.attributes.ac.bonus"),
        ],
      },
    ];
  }
}
