import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Trollkin: a bonus action spends up to proficiency bonus Hit Dice, rolling each plus Constitution.
 * Each scaling step spends another die; the largest die size stands in for mixed pools.
 */
export default class TrollishRegeneration extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "bonus",
      activationCondition: "Lost until a Short Rest after taking Acid or Fire damage",
      additionalConsumptionTargets: [
        { type: "hitDice", target: "largest", value: "1", scaling: { mode: "amount", formula: "" } },
      ],
      data: {
        consumption: { scaling: { allowed: true, max: "@prof - 1" } },
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "(1 + @scaling)d@attributes.hd.largestFace + (1 + @scaling) * @abilities.con.mod",
          types: ["healing"],
        }),
      },
    };
  }

}
