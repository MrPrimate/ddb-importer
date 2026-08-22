import Generic from "../Generic";

export default class EmboldeningBond extends Generic {

  override get effects(): IDDBEffectHint[] {
    return this.isAction
      ? [
        {
          changes: [
            Generic.ChangeHelper.addChange("1d4", 2, "system.rolls.ability.save.bonus"),
            Generic.ChangeHelper.addChange("1d4", 2, "system.rolls.ability.check.bonus"),
            Generic.ChangeHelper.addChange("1d4", 2, "system.rolls.attack.mwak.bonus"),
            Generic.ChangeHelper.addChange("1d4", 2, "system.rolls.attack.rwak.bonus"),
            Generic.ChangeHelper.addChange("1d4", 2, "system.rolls.attack.msak.bonus"),
            Generic.ChangeHelper.addChange("1d4", 2, "system.rolls.attack.rsak.bonus"),
          ],
        },
      ]
      : [];
  }
}
