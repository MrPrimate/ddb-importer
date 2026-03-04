import _IntuitionActionBase from "./_IntuitionActionBase";

export default class HuntersIntuition extends _IntuitionActionBase {

  get effects(): IDDBEffectHint[] {
    const effectBase = super.effects;
    effectBase[0].changes = [
      _IntuitionActionBase.ChangeHelper.addChange(`@scale.${this.parentIdentifier}.die`, 20, "system.skills.sur.bonuses.check"),
      _IntuitionActionBase.ChangeHelper.addChange(`@scale.${this.parentIdentifier}.die`, 20, "system.skills.prc.bonuses.check"),
    ];
    return effectBase;
  }

}

