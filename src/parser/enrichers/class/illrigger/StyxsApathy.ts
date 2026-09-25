import DDBEnricherData from "../../data/DDBEnricherData";
import _Illrigger from "./_Illrigger";

export default class StyxsApathy extends _Illrigger {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Styx's Apathy",
      activationType: "reaction",
      activationCondition: "When you burn a seal on an interdicted creature",
      targetType: "creature",
      targetCount: 1,
      rangeType: "ft",
      rangeValue: 30,
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Styx's Apathy",
        activityMatch: "Styx's Apathy",
        options: {
          description: "You can't take reactions until the end of your next turn.",
          expiry: "targetEnd",
        },
      },
    ];
  }

}
