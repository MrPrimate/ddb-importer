import DDBEnricherData from "../data/DDBEnricherData";

export default class GrapplingHook extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return this.is2014 ? null : DDBEnricherData.ACTIVITY_TYPES.CHECK;
  }

  override get activity(): IDDBActivityData | null {
    if (this.is2014) {
      return null;
    }
    return {
      name: "Throw Hook",
      activationType: "action",
      activationCondition: "Throw at a catch within 50 feet",
      noConsumeTargets: true,
      noTemplate: true,
      targetType: "self",
      targetCount: "1",
      rangeType: "ft",
      rangeValue: 50,
      overrideRange: true,
      data: { check: { ability: "dex", associated: ["acr"], dc: { calculation: "", formula: "13" } } },
    };
  }

}
