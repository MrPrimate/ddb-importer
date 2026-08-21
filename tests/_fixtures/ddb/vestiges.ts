// =============================================================================
// Vestiges of Divergence - multi-stage items. DDB ships one item definition per
// stage, but every stage's description repeats all lower stages, so a naive
// whole-description scan always reports the dormant numbers.
// Description prose below is copied verbatim from captured DDB payloads.
// =============================================================================

// <h4>Stage</h4> headings, charges restated in full at every stage.
export const CABALS_RUIN = [
  "<p>This cloak is made of heavy dark cloth trimmed with golden patterns.</p>",
  "<h4>Dormant</h4>",
  "<p>While <em>Cabal’s Ruin</em> is in a dormant state, the cloak has 4 charges and it regains 1d4 expended charges daily at dawn.</p>",
  "<p>When you are targeted by an enemy’s spell, you can use your reaction to absorb a portion of the spell’s energy into the cloak. This property can’t be used again until you finish a short or long rest.</p>",
  "<h4>Awakened</h4>",
  "<ul><li>The cloak has 6 charges and it regains 1d4 + 2 expended charges daily at dawn.</li></ul>",
  "<h4>Exalted</h4>",
  "<ul><li>The cloak has 10 charges and it regains 1d6 + 4 expended charges daily at dawn.</li></ul>",
].join("");

// As above, but "has 12 charges," carries a comma and the dormant section says
// "and regains" where the later ones say "and it regains".
export const SPIRE_OF_CONFLUX = [
  "<p>A powerful relic passed down from generation to generation of Ashari leaders.</p>",
  "<h4>Dormant</h4>",
  "<p>While the <em>Spire of Conflux</em> is in a dormant state, the staff has 8 charges and regains 1d4 + 2 expended charges daily at dawn.</p>",
  "<h4>Awakened</h4>",
  "<ul><li>The staff has 12 charges, and it regains 1d6 + 2 expended charges daily at dawn.</li></ul>",
  "<h4>Exalted</h4>",
  "<ul><li>The staff has 20 charges, and it regains 1d6 + 4 expended charges daily at dawn.</li></ul>",
].join("");

// Bolded "Stage State." lead-ins rather than <h4>, a delta charge phrasing, and
// no recharge restated after the dormant section - it has to be inherited.
export const JEWEL_OF_THREE_PRAYERS = [
  "<p>The <em>Jewel of Three Prayers</em> is a Vestige of Divergence.</p>",
  "<p><em><strong>Dormant State.</strong></em> In this state, the Jewel of Three Prayers is a glittering golden disk.</p>",
  "<p>In its Dormant State, the jewel has the following properties:</p>",
  "<ul><li>The jewel has 3 charges and regains all its expended charges daily at dawn. While holding the jewel, you can expend 1 charge from it to cast the invisibility spell.</li></ul>",
  "<p><em><strong>Awakened State.&nbsp;</strong></em>In this state, the jewel has received the blessing of Avandra the Change Bringer.</p>",
  "<ul><li>The bonus that the jewel confers to your AC increases to +2.</li><li>Its number of charges increases to 5.</li></ul>",
  "<p><em><strong>Exalted State.</strong></em> In this state, the jewel has received the blessing of Corellon the Arch Heart.</p>",
  "<ul><li>The bonus that the jewel confers to your AC increases to +3.</li><li>Its number of charges increases to 7.</li></ul>",
].join("");

// A staged item with no charges at all (Blade of Broken Mirrors markup).
export const NO_CHARGE_VESTIGE = [
  "<p>A shard of a shattered mirror set into a hilt.</p>",
  "<h4><strong>Dormant</strong></h4>",
  "<p>You gain a +1 bonus to attack and damage rolls made with this magic weapon.</p>",
  "<h4><strong>Awakened</strong></h4>",
  "<p>The bonus increases to +2.</p>",
  "<h4><strong>Exalted</strong></h4>",
  "<p>The bonus increases to +3.</p>",
].join("");
