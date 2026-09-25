import DDBDataUtils from "../../../lib/DDBDataUtils";
import DDBEnricherData from "../../data/DDBEnricherData";

export default class Feed extends DDBEnricherData {

  static FEED_SCALE = "@scale.kindred.feed";

  /**
   * Boon of Generations (Deep Feeding) rerolls a Feed Die that comes up 1 and must use the new
   * roll, which is exactly `r1`. Feed Dice are a dice scale value, and a die modifier cannot be
   * appended to a bare `@scale` reference, so the modified roll is spelled out from the scale's
   * `number` and `faces`.
   */
  get feedFormula(): string {
    const ddbData = this.ddbParser?.ddbData;
    const deepFeeding = ddbData ? DDBDataUtils.hasCharacterFeat(ddbData, "Boon of Generations") : false;
    return deepFeeding
      ? `(${Feed.FEED_SCALE}.number)d(${Feed.FEED_SCALE}.faces)r1`
      : Feed.FEED_SCALE;
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
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
          formula: this.feedFormula,
          name: "Feed Dice (roll up to max; regain Blood Points)",
        },
      },
    };
  }

}
