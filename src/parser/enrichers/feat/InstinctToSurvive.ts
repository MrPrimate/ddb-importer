import DDBEnricherData from "../data/DDBEnricherData";

/** I Survived to Tell the Tale: once per long rest, damage that would drop you to 0 hit points lets you regain hit points equal to your level. */
export default class InstinctToSurvive extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "special",
      activationCondition: "You take damage that would reduce you to 0 hit points",
      addItemConsume: true,
      data: {
        healing: DDBEnricherData.basicDamagePart({ customFormula: "@details.level", types: ["healing"] }),
      },
    };
  }

}
