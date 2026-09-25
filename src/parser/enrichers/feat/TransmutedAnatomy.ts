import DDBEnricherData from "../data/DDBEnricherData";

export default class TransmutedAnatomy extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get useDefaultAdditionalActivities(): boolean {
    return false;
  }

  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Resilient Anatomy",
      targetType: "self",
      activationType: "reaction",
      activationCondition: "When you fail a Constitution saving throw",
      addItemConsume: true,
      data: {
        roll: { name: "Save Bonus", formula: "1d4", prompt: false, visible: true },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Lengthened Stride",
        options: { transfer: true },
        changes: [DDBEnricherData.ChangeHelper.movementBonusChange("5", 20)],
      },
    ];
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({
        type: "feat",
        name: "Resilient Anatomy",
        max: "@prof",
        period: "lr",
      }),
    };
  }

}
