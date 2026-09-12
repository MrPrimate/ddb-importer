import DDBEnricherData from "../../data/DDBEnricherData";

export default class BurstOfSpeed extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "special",
      activationCondition: "On your turn",
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Burst of Speed",
        options: {
          expiry: "turnEnd",
          description: "Your Speed increases by 30 feet until the end of the turn.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.movementBonusChange("30", 30),
        ],
      },
    ];
  }

}
