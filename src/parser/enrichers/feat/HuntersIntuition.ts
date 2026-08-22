import _IntuitionActionBase from "./_IntuitionActionBase";

export default class HuntersIntuition extends _IntuitionActionBase {

  override get effects(): IDDBEffectHint[] {
    const effectBase = super.effects;
    effectBase[0].changes = [
      _IntuitionActionBase.ChangeHelper.addChange(`@scale.${this.parentIdentifier}.die`, 20, "system.skills.sur.roll.bonus"),
      _IntuitionActionBase.ChangeHelper.addChange(`@scale.${this.parentIdentifier}.die`, 20, "system.skills.prc.roll.bonus"),
    ];
    return effectBase;
  }

}

