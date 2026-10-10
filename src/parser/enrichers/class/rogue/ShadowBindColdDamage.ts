import DDBEnricherData from "../../data/DDBEnricherData";

/** Shadow Bind (Cold Damage): once on each of your turns, a weapon hit deals extra cold damage equal to your proficiency bonus. */
export default class ShadowBindColdDamage extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      targetCount: 1,
      activationType: "special",
      activationCondition: "Once on each of your turns, you hit with a melee or ranged weapon attack",
      noTemplate: true,
      data: {
        damage: { parts: [DDBEnricherData.basicDamagePart({ customFormula: "@prof", types: ["cold"] })] },
      },
    };
  }

}
