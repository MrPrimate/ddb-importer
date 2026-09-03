import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * The Wisdom bonus to cleric cantrip damage is a native damage rule on this feature's transfer
 * effect, generated from the DDB modifier (EffectGenerator._addCantripDamageBonus), so the
 * enricher only has to keep the feature passive.
 */
export default class BlessedStrikesPotentSpellcasting extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return "none";
  }

}
