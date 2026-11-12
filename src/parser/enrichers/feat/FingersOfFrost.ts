import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Fingers of Frost (World of Warcraft): spells ignore Cold Resistance (a dnd5e 6.1 damage
 * application rule, not available on this dnd5e version), and Frostbite adds Proficiency Bonus d4s
 * of Cold damage against a Restrained creature.
 */
export default class FingersOfFrost extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Frostbite",
      activationType: "special",
      activationCondition: "You deal Cold damage to a Restrained creature",
      targetType: "creature",
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({ customFormula: "(@prof)d4", types: ["cold"] }),
          ],
        },
      },
    };
  }

}
