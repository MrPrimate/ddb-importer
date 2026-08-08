import DDBEnricherData from "../../data/DDBEnricherData";
import _RiteFocus from "./_RiteFocus";


export default class RiteFocusTheGreatOldOne extends _RiteFocus {

  get patronName(): string {
    return "The Great Old One";
  }

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      name: this.activityName,
      targetType: "creature",
      targetCount: "",
      rangeType: "ft",
      rangeValue: 10,
      activationType: "special",
      activationCondition: "When you score a critical hit, while you have an active crimson rite",
    };
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Frightened by the Great Old One",
        activityMatch: this.activityName,
        statuses: ["frightened"],
        options: {
          description: "You are frightened of the blood hunter until the end of their next turn.",
        },
        daeSpecialDurations: ["turnEndSource"],
      },
    ];
  }

}
