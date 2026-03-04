import _IntuitionActionBase from "./_IntuitionActionBase";

export default class IntuitiveMotion extends _IntuitionActionBase {

  get effects(): IDDBEffectHint[] {
    const effectBase = super.effects;
    effectBase[0].changes = [
      _IntuitionActionBase.ChangeHelper.addChange(`@scale.${this.parentIdentifier}.die`, 20, "system.skills.acr.bonuses.check"),
      _IntuitionActionBase.ChangeHelper.addChange(`@scale.${this.parentIdentifier}.die`, 20, "system.skills.ath.bonuses.check"),
    ];
    return effectBase;
  }

}
