import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Trollkin: a bonus action spends up to proficiency bonus Hit Dice, rolling each plus Constitution.
 * Each scaling step spends another die, and the heal rolls the dice spent (`@consumed.hd`).
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
        consumption: { scaling: { allowed: true, max: "@prof" } },
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "@consumed.hd + @scaling * @abilities.con.mod",
          types: ["healing"],
        }),
      },
    };
  }

}
