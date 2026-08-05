import DDBEnricherData from "../data/DDBEnricherData";

export default class CloakOfShadowsUnseenPassage extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "action",
      activationCondition: "Magic action",
    };
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Unseen Passage",
        statuses: ["Invisible"],
        options: {
          durationRounds: 1,
          description: "You have the Invisible condition until the end of your next turn.",
        },
        daeSpecialDurations: ["turnEndSource"],
      },
    ];
  }

}
