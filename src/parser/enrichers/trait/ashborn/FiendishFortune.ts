import DDBEnricherData from "../../data/DDBEnricherData";

/** Ashborn: a Reaction turns a non-critical hit into a miss and deals Force damage equal to your proficiency bonus to a creature within 5 feet. */
export default class FiendishFortune extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      targetCount: 1,
      activationType: "reaction",
      activationCondition: "You are hit by an attack roll that isn't a Critical Hit (the attack misses instead)",
      addItemConsume: true,
      data: {
        range: { override: true, value: "5", units: "ft" },
        damage: { parts: [DDBEnricherData.basicDamagePart({ customFormula: "@prof", types: ["force"] })] },
      },
    };
  }

}
