import DDBEnricherData from "../data/DDBEnricherData";

/** DDB's bare hit-point modifier is replaced by the Arcane Recovery heal it describes. */
export default class ScarletSpellbook extends DDBEnricherData {

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Arcane Stamina",
      targetType: "self",
      activationType: "special",
      activationCondition: "When you use Arcane Recovery",
      data: {
        healing: DDBEnricherData.basicDamagePart({
          number: 2,
          denomination: 6,
          bonus: "floor(@classes.wizard.levels / 2)",
          types: ["healing"],
        }),
      },
    };
  }

}
