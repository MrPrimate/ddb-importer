import Generic from "../Generic";

/**
 * Death Domain: necrotic damage from cleric spells and Channel Divinity ignores Necrotic
 * Resistance. The cleric identifier filter covers both on dnd5e 6.1, and also the domain's other
 * cleric features, none of which deal necrotic damage outside Channel Divinity.
 */
export default class InescapableDestruction extends Generic {

  override get effects(): IDDBEffectHint[] {
    return Generic.damageRuleEffect(
      "Inescapable Destruction",
      Generic.ChangeHelper.ignoreResistanceChanges("necrotic", {
        conditions: Generic.ChangeHelper.classSpellFilter("cleric"),
      }),
    );
  }

}
