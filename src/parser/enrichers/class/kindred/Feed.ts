import DDBEnricherData from "../../data/DDBEnricherData";

export default class Feed extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      targetCount: 1,
      activationType: "action",
      activationCondition: "Once per turn; target within 5 ft is willing, Charmed by you, or Incapacitated/Grappled/Paralyzed/Restrained/Stunned/Unconscious",
      rangeType: "ft",
      rangeValue: 5,
      data: {
        roll: {
          prompt: true,
          visible: true,
          formula: "@scale.kindred.feed",
          name: "Feed Dice (roll up to max; regain Blood Points)",
        },
      },
    };
  }

}
