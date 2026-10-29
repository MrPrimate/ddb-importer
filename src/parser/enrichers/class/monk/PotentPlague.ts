import Generic from "../Generic";

/** Necrotic and Poison damage you deal ignores the target's Resistance to those types. */
export default class PotentPlague extends Generic {

  override get effects(): IDDBEffectHint[] {
    return Generic.damageRuleEffect(
      "Potent Plague",
      Generic.ChangeHelper.ignoreResistanceChanges(["necrotic", "poison"]),
    );
  }

}
