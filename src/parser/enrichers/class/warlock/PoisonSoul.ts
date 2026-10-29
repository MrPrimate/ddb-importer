import Generic from "../Generic";

/** Poison damage you deal ignores Resistance and Immunity. */
export default class PoisonSoul extends Generic {

  override get effects(): IDDBEffectHint[] {
    return Generic.damageRuleEffect("Poison Soul", [
      ...Generic.ChangeHelper.ignoreResistanceChanges("poison"),
      ...Generic.ChangeHelper.ignoreImmunityChanges("poison"),
    ]);
  }

}
