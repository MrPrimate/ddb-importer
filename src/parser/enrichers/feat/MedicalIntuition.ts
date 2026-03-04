import _IntuitionActionBase from "./_IntuitionActionBase";

export default class MedicalIntuition extends _IntuitionActionBase {

  get effects(): IDDBEffectHint[] {
    const effectBase = super.effects;
    effectBase[0].changes = [
      _IntuitionActionBase.ChangeHelper.addChange(`@scale.${this.parentIdentifier}.die`, 20, "system.skills.med.bonuses.check"),
      _IntuitionActionBase.ChangeHelper.addChange(`@scale.${this.parentIdentifier}.die`, 20, "system.tools.herb.bonuses.check"),
    ];
    return effectBase;
  }

}
