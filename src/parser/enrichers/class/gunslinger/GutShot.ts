import DDBEnricherData from "../../data/DDBEnricherData";

export default class GutShot extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      targetCount: 1,
      activationType: "special",
      activationCondition: "You score a critical hit with a ranged weapon attack against a Large or smaller creature",
      noTemplate: true,
      data: {
        duration: {
          units: "minute",
          value: "1",
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Gut Shot",
        options: {
          durationSeconds: 60,
        },
        changes: [
          DDBEnricherData.ChangeHelper.movementMultiplierChange("0.5", 20),
        ],
      },
    ];
  }

}
