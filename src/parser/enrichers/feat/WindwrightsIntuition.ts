import _IntuitionActionBase from "./_IntuitionActionBase";

export default class WindwrightsIntuition extends _IntuitionActionBase {

  override get effects(): IDDBEffectHint[] {
    const effectBase = super.effects;
    effectBase[0].changes = [
      _IntuitionActionBase.ChangeHelper.addChange(`@scale.${this.parentIdentifier}.die`, 20, "system.skills.acr.roll.bonus"),
      _IntuitionActionBase.ChangeHelper.addChange(`@scale.${this.parentIdentifier}.die`, 20, "system.tools.navg.roll.bonus"),
    ];
    return effectBase;
  }

}
