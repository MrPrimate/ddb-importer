import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Periapt of Health: the once-per-dawn 2d4 heal.
 */
export default class PeriaptOfHealth extends DDBEnricherData {
  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "self",
      rangeSelf: true,
      addItemConsume: true,
      data: { healing: DDBEnricherData.basicDamagePart({ number: 2, denomination: 4, types: ["healing"] }) },
    };
  }

}
