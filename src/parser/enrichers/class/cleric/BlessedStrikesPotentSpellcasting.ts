import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * The Wisdom bonus to cleric cantrip damage is folded into the cantrips by the spell parser
 * (CharacterSpellFactory.isCantripBoost), so the enricher only has to keep the feature passive.
 */
export default class BlessedStrikesPotentSpellcasting extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return "none";
  }

}
