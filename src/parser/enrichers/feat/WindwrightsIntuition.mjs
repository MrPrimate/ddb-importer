/* eslint-disable class-methods-use-this */
import _IntuitionActionBase from "./_IntuitionActionBase.mjs";

export default class WindwrightsIntuition extends _IntuitionActionBase {

  get effects() {
    const effectBase = super.effects;
    effectBase[0].changes = [
      _IntuitionActionBase.ChangeHelper.addChange(`@scale.${this.parentIdentifier}.die`, 20, "system.skills.acr.bonuses.check"),
      _IntuitionActionBase.ChangeHelper.addChange(`@scale.${this.parentIdentifier}.die`, 20, "system.tools.navg.bonuses.check"),
    ];
    return effectBase;
  }

}
