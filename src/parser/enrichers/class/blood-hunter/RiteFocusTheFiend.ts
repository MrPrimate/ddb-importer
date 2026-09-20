import _RiteFocus from "./_RiteFocus";

/**
 * While using the Rite of the Flame, reroll a 1 or 2 on the rite's extra damage
 * die and choose which roll to use.
 *
 * The reroll lives on the rite, not here: `_CrimsonRite.riteDamagePartValue` gives the
 * Rite of the Flame enchantment an `r<=2` die modifier when the character has this patron,
 * which scopes it to the rite's extra die alone. midi's optional damage reroll
 * (reroll-kh, as used by Savage Attacker) rerolls the whole damage roll, so it is
 * not used. This feature stays passive, with the DDB action suppressed so it does
 * not attach a meaningless activity.
 */
export default class RiteFocusTheFiend extends _RiteFocus {

  override get patronName(): string {
    return "The Fiend";
  }

  override get useDefaultAdditionalActivities(): boolean {
    return false;
  }

  override get override(): IDDBOverrideData {
    return {
      descriptionSuffix: `
<section class="secret ddbSecret" id="secret-ddbRiteFocusTheFiend">
<p><strong>Implementation Details</strong></p>
<p>DDB Importer adds the reroll to the Rite of the Flame weapon enchantment, whose extra damage die rerolls a 1 or 2 once (<code>r&lt;=2</code>). The new roll is always used; the rules let you keep the original, which only matters when a 2 is rerolled into a 1.</p>
</section>`,
    };
  }

}
