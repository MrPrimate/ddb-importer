import DDBEnricherData from "../data/DDBEnricherData";

/** Remarkable Recovery: when stabilized while dying, regain Hit Points equal to your Constitution modifier (minimum 1). */
export default class RemarkableRecoveryRegainHitPoints extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "special",
      activationCondition: "You are successfully stabilized while dying",
      data: {
        healing: DDBEnricherData.basicDamagePart({ customFormula: "max(1, @abilities.con.mod)", types: ["healing"] }),
      },
    };
  }

}
