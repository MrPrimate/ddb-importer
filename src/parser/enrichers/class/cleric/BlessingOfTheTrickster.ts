import DDBEnricherData from "../../data/DDBEnricherData";

export default class BlessingOfTheTrickster extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  // 2014: touch, lasts 1 hour. 2024: 30 ft, lasts until a long rest or the next use.
  override get activity(): IDDBActivityData {
    return {
      name: "Blessing of the Trickster",
      activationType: "action",
      targetType: "creature",
      targetCount: 1,
      rangeType: this.is2014 ? "touch" : "ft",
      rangeValue: this.is2014 ? null : 30,
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Blessing of the Trickster",
        options: this.is2014
          ? { durationSeconds: 3600 }
          : { expiry: "longRest" },
        changes: [
          DDBEnricherData.ChangeHelper.advantageSkillChange("ste"),
        ],
      },
    ];
  }

}
