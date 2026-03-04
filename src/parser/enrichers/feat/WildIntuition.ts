import _IntuitionActionBase from "./_IntuitionActionBase";

export default class WildIntuition extends _IntuitionActionBase {

  get effects(): IDDBEffectHint[] {
    const effectBase = super.effects;
    effectBase[0].changes = [
      _IntuitionActionBase.ChangeHelper.addChange(`@scale.${this.parentIdentifier}.die`, 20, "system.skills.ani.bonuses.check"),
      _IntuitionActionBase.ChangeHelper.addChange(`@scale.${this.parentIdentifier}.die`, 20, "system.skills.nat.bonuses.check"),
    ];
    return effectBase;
  }

}
