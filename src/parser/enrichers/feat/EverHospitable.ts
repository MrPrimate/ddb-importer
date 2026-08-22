import _IntuitionActionBase from "./_IntuitionActionBase";

export default class EverHospitable extends _IntuitionActionBase {

  override get effects(): IDDBEffectHint[] {
    const effectBase = super.effects;
    effectBase[0].changes = [
      _IntuitionActionBase.ChangeHelper.addChange(`@scale.${this.parentIdentifier}.die`, 20, "system.skills.prc.roll.bonus"),
      _IntuitionActionBase.ChangeHelper.addChange(`@scale.${this.parentIdentifier}.die`, 20, "system.tools.cook.roll.bonus"),
      _IntuitionActionBase.ChangeHelper.addChange(`@scale.${this.parentIdentifier}.die`, 20, "system.tools.brewer.roll.bonus"),
    ];
    return effectBase;
  }

}
