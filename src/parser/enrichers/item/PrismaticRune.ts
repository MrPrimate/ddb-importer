import DDBEnricherData from "../data/DDBEnricherData";
import utils from "../../../lib/Utils";

/**
 * As the official Arcana Unleashed item: spending a charge converts a spell's damage to Acid, Cold,
 * Fire, Lightning or Thunder, as an enchantment on the spell with one profile per damage type. dnd5e
 * spells keep their damage on their activities, so the enchantment marks the spell (its name) and
 * the damage type is changed when the damage is rolled.
 */
export default class PrismaticRune extends DDBEnricherData {

  static TYPES = ["acid", "cold", "fire", "lightning", "thunder"];

  override get type(): IDDBActivityType {
    return DDBEnricherData.ACTIVITY_TYPES.ENCHANT;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Prismatic Conversion",
      addItemConsume: true,
      noTemplate: true,
      data: {
        restrictions: { type: "spell", allowMagical: false },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return PrismaticRune.TYPES.map((type) => {
      const label = utils.capitalize(type);
      return {
        name: `Prismatic Conversion: ${label}`,
        type: "enchant",
        activityMatch: "Prismatic Conversion",
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange(type, 20, "system.damage.types"),
          DDBEnricherData.ChangeHelper.overrideChange(`{} (${label} Damage)`, 20, "name"),
        ],
      };
    });
  }

}
