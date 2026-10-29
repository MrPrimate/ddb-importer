import Generic from "../Generic";

/**
 * Mounting Dread: necrotic damage dealt by you or the grim ignores Resistance. This is the ranger's
 * half; the grim's half is linked to its summon activity by the Grim enricher, because rules only
 * reach the actor that rolls.
 */
export default class HarbingerOfDoom extends Generic {

  override get effects(): IDDBEffectHint[] {
    return Generic.damageRuleEffect(
      "Mounting Dread",
      Generic.ChangeHelper.ignoreResistanceChanges("necrotic"),
    );
  }

}
