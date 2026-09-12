import DDBEnricherData from "../../data/DDBEnricherData";

export default class FelineAgility extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "special",
      activationCondition: "When you move on your turn; recharges after a turn in which you move 0 feet",
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Feline Agility",
        options: {
          expiry: "turnEnd",
          description: "Your Speed is doubled until the end of the turn.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.movementMultiplierChange("2", 30),
        ],
      },
    ];
  }

}
