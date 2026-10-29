import Generic from "./Generic";

/** Searing Spellfire: a damage roll that deals Radiant damage ignores Radiant Resistance. */
export default class SpellfireAdept extends Generic {

  override get effects(): IDDBEffectHint[] {
    return Generic.damageRuleEffect(
      "Searing Spellfire",
      Generic.ChangeHelper.ignoreResistanceChanges("radiant"),
    );
  }

}
