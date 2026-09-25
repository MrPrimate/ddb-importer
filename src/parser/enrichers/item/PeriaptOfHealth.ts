import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Periapt of Health. The 2024 pendant heals 2d4 + 2 once per dawn (the DDB hit-points modifier and
 * the official compendium both carry the +2); the 2014 pendant only grants disease immunity, which
 * the modifier effect covers, so it gets no activity at all.
 */
export default class PeriaptOfHealth extends DDBEnricherData {
  override get type(): IDDBActivityType | null {
    return this.is2014 ? null : DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get stopDefaultActivity(): boolean {
    return this.is2014;
  }

  override get activity(): IDDBActivityData | null {
    if (this.is2014) return null;
    return {
      targetType: "self",
      rangeSelf: true,
      addItemConsume: true,
      data: { healing: DDBEnricherData.basicDamagePart({ number: 2, denomination: 4, bonus: "2", types: ["healing"] }) },
    };
  }

}
