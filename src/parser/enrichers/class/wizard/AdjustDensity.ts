import DDBEnricherData from "../../data/DDBEnricherData";

export default class AdjustDensity extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      activationType: "action",
      activationCondition: "Large or smaller (Huge at level 10); up to 1 minute, concentration",
      data: {
        range: {
          units: "ft",
          value: "30",
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Adjust Density: Halved Weight",
        options: {
          durationSeconds: 60,
          description: "Speed +10 ft, jump distance doubled, disadvantage on Strength checks and saving throws.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.movementBonusChange("10", 30),
          DDBEnricherData.ChangeHelper.disadvantageAbilityCheckChange("str"),
          DDBEnricherData.ChangeHelper.disadvantageAbilitySaveChange("str"),
        ],
      },
      {
        name: "Adjust Density: Doubled Weight",
        options: {
          durationSeconds: 60,
          description: "Speed -10 ft, advantage on Strength checks and saving throws.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.movementBonusChange("-10", 30),
          DDBEnricherData.ChangeHelper.advantageAbilityCheckChange("str"),
          DDBEnricherData.ChangeHelper.advantageAbilitySaveChange("str"),
        ],
      },
    ];
  }

}
