import DDBEnricherData from "../data/DDBEnricherData";

export default class CloakOfShadowsUnseenPassage extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "action",
      activationCondition: "Magic action",
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Unseen Passage",
        statuses: ["Invisible"],
        options: {
          expiry: "sourceEnd",
          description: "You have the Invisible condition until the end of your next turn.",
        },
      },
    ];
  }

}
