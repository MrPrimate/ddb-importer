import DDBEnricherData from "../../data/DDBEnricherData";

export default class AuraOfResilience extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return this.isAction ? null : DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    if (this.isAction) return {};
    return {
      name: "Aura of Resilience",
      targetType: "self",
      activationType: "special",
      activationCondition: "When you use your Dig Deep",
      addItemConsume: true,
      data: {
        duration: { value: "10", units: "minute", special: "" },
      },
    };
  }

  override get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({
        type: "class",
        name: "Aura of Resilience",
        includesName: true,
        max: "1",
        period: "lr",
      }),
    };
  }

}
