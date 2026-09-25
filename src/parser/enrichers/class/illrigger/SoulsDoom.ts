import DDBEnricherData from "../../data/DDBEnricherData";
import _Illrigger from "./_Illrigger";

export default class SoulsDoom extends _Illrigger {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Soul's Doom",
      activationType: "special",
      activationCondition: "When you place or move a seal with a bonus action",
      targetType: "creature",
      targetCount: 1,
      rangeType: "ft",
      rangeValue: 30,
      data: {
        duration: {
          units: "minute",
          value: "1",
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Soul's Doom",
        activityMatch: "Soul's Doom",
        options: {
          durationSeconds: 60,
          description: "Whenever you take damage, you take extra damage equal to the illrigger's proficiency bonus.",
        },
      },
    ];
  }

}
