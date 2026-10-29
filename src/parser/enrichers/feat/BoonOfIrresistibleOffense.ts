import Generic from "./Generic";

/** Overcome Defenses: Bludgeoning, Piercing and Slashing damage you deal ignores Resistance. */
export default class BoonOfIrresistibleOffense extends Generic {

  override get effects(): IDDBEffectHint[] {
    return Generic.damageRuleEffect(
      "Overcome Defenses",
      Generic.ChangeHelper.ignoreResistanceChanges(["bludgeoning", "piercing", "slashing"]),
    );
  }

}
