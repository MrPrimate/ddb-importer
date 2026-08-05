import DDBEnricherData from "../../data/DDBEnricherData";

export default class FelineAgility extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "special",
      activationCondition: "When you move on your turn; recharges after a turn in which you move 0 feet",
    };
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Feline Agility",
        options: {
          durationTurns: 1,
          description: "Your Speed is doubled until the end of the turn.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.multiplyChange("2", 30, "system.attributes.movement.walk"),
        ],
      },
    ];
  }

}
