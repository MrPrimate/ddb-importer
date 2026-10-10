import DDBEnricherData from "../data/DDBEnricherData";

/** Skirmisher: once on each of your turns, after moving 15 feet, a bludgeoning, piercing or slashing hit deals extra damage equal to your proficiency bonus. */
export default class StrikeAndFade extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      targetCount: 1,
      activationType: "special",
      activationCondition: "Once on each of your turns, you hit after moving at least 15 feet",
      noTemplate: true,
      data: {
        damage: { parts: [DDBEnricherData.basicDamagePart({ customFormula: "@prof", types: ["bludgeoning", "piercing", "slashing"] })] },
      },
    };
  }

}
