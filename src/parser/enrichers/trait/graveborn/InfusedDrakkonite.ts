import DDBEnricherData from "../../data/DDBEnricherData";

/** Graveborn: once per short or long rest, damage ignores the creature's Resistances and adds Necrotic damage equal to your proficiency bonus. */
export default class InfusedDrakkonite extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      targetCount: 1,
      activationType: "special",
      activationCondition: "You damage a creature (ignoring its Resistances)",
      addItemConsume: true,
      data: {
        damage: { parts: [DDBEnricherData.basicDamagePart({ customFormula: "@prof", types: ["necrotic"] })] },
      },
    };
  }

}
