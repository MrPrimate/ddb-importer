import DDBEnricherData from "../data/DDBEnricherData";

export default class MonsterCamouflage extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return this.is2014 ? null : DDBEnricherData.ACTIVITY_TYPES.CHECK;
  }

  override get activity(): IDDBActivityData | null {
    if (this.is2014) {
      return null;
    }
    return {
      name: "Inspect Disguise",
      activationType: "action",
      activationCondition:
        "Observer check; advantage within 30 feet. Automatically succeeds if the wearer does something the monster cannot do.",
      noConsumeTargets: true,
      noTemplate: true,
      targetType: "creature",
      targetCount: "1",
      rangeType: "any",
      rangeValue: null,
      overrideRange: true,
      data: { check: { ability: "int", associated: ["inv", "nat"], dc: { calculation: "", formula: "10" } } },
    };
  }

}
