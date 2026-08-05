import DDBEnricherData from "../data/DDBEnricherData";

export default class ThinBloodedFeed extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      // mirrors the Kindred class Feed enricher; thin-bloods have a fixed
      // 2d6 Feed Dice pool plus Constitution modifier dice
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
          formula: "(2 + max(0, @abilities.con.mod))d6",
          name: "Feed Dice (Necrotic damage; reduces Hit Point maximum; 6s regain Blood Points)",
        },
      },
    };
  }

}
