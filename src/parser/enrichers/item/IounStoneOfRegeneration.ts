import DDBEnricherData from "../data/DDBEnricherData";

export default class IounStoneOfRegeneration extends DDBEnricherData {

  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get type(): IDDBActivityType {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Regeneration",
      activationType: "special",
      noConsumeTargets: true,
      activationCondition: "At the end of each hour the stone orbits you, while you have at least 1 Hit Point",
      rangeSelf: true,
      targetType: "self",
      noTemplate: true,
      data: { healing: DDBEnricherData.basicDamagePart({ bonus: "15", type: "healing" }) },
    };
  }

}
