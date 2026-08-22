import _IntuitionActionBase from "./_IntuitionActionBase";

export default class WardersIntuition extends _IntuitionActionBase {

  override get effects(): IDDBEffectHint[] {
    const effectBase = super.effects;
    effectBase[0].changes = [
      _IntuitionActionBase.ChangeHelper.addChange(`@scale.${this.parentIdentifier}.die`, 20, "system.skills.inv.roll.bonus"),
      _IntuitionActionBase.ChangeHelper.addChange(`@scale.${this.parentIdentifier}.die`, 20, "system.tools.thief.roll.bonus"),
    ];
    return effectBase;
  }

}
