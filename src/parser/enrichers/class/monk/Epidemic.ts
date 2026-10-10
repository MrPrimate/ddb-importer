import DDBEnricherData from "../../data/DDBEnricherData";

/** Pestilent Haze: Necrotic damage to a creature cursed by your Miasmic Plague deals one extra Martial Arts die of Necrotic. */
export default class Epidemic extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Epidemic",
      targetType: "creature",
      targetCount: 1,
      activationType: "special",
      activationCondition: "You deal Necrotic damage to a creature cursed by your Miasmic Plague",
      data: {
        damage: {
          parts: [DDBEnricherData.basicDamagePart({ customFormula: "@scale.monk.die", types: ["necrotic"] })],
        },
      },
    };
  }

}
