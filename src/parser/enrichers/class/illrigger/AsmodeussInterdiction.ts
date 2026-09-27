import DDBEnricherData from "../../data/DDBEnricherData";
import _Illrigger from "./_Illrigger";

/**
 * DDB's three boon actions are kept, with Spellbreaker and Hell Mage hidden until the illrigger
 * reaches 13th and 18th level. Spellbreaker's counterspell is cast by hand.
 */
export default class AsmodeussInterdiction extends _Illrigger {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      { action: { name: "Asmodeus's Interdiction: Axiomatic Seals (Passive)", type: "class" } },
      {
        action: { name: "Asmodeus's Interdiction: Spellbreaker", type: "class" },
        overrides: { data: _Illrigger.boonVisibility(13) },
      },
      {
        action: { name: "Asmodeus's Interdiction: Hell Mage (Passive)", type: "class" },
        overrides: { data: _Illrigger.boonVisibility(18) },
      },
    ];
  }

}
