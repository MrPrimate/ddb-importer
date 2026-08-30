import DDBEnricherData from "../../data/DDBEnricherData";

export default class LongArmOfTheLaw extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      targetCount: 1,
      activationType: "special",
      activationCondition: "Once per turn, when you hit a Large or smaller creature with a ranged weapon attack",
      noTemplate: true,
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Hobbled",
        options: {
          expiry: "targetEnd",
          description: "Cannot move on its next turn unless it first takes the Disengage action.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.movementMultiplierChange("0", 20),
        ],
      },
    ];
  }

}
