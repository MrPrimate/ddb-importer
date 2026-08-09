import DDBEnricherData from "../../data/DDBEnricherData";

export default class EntrancingMovementDamage extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "enemy",
      activationType: "special",
      activationCondition: "A creature hits you with an Opportunity Attack, or hits you while you benefit from the Dodge action",
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "@abilities.cha.mod + floor(@classes.bard.levels / 2)",
              types: ["psychic"],
            }),
          ],
        },
      },
    };
  }

}
