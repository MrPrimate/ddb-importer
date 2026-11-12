import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Expendable Minions (World of Warcraft Eldritch Invocation): when your familiar or a summoned
 * creature you control dies, you or another creature within 60 feet regains Warlock levels + Cha
 * modifier Hit Points.
 */
export default class EldritchInvocationsExpendableMinions extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Expendable Minions",
      activationType: "special",
      activationCondition: "When your familiar or a summoned creature you control dies",
      targetType: "creature",
      data: {
        range: { units: "ft", value: "60" },
        healing: DDBEnricherData.basicDamagePart({
          customFormula: `@classes.${this.classIdentifier("Warlock")}.levels + @abilities.cha.mod`,
          types: ["healing"],
        }),
      },
    };
  }

}
