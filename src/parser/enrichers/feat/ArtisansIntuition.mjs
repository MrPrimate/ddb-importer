/* eslint-disable class-methods-use-this */
import { DICTIONARY } from "../../../config/_module.mjs";
import _IntuitionActionBase from "./_IntuitionActionBase.mjs";

export default class ArtisansIntuition extends _IntuitionActionBase {

  get effects() {
    const id = this.parentIdentifier;
    const artChanges = DICTIONARY.actor.proficiencies
      .filter((p) => p.type === "Tool" && p.toolType === "art" && p.baseTool).map((p) => p.baseTool)
      .map((t) => _IntuitionActionBase.ChangeHelper.addChange(`@scale.${id}.die`, 20, `system.tools.${t}.bonuses.check`));
    const effectBase = super.effects;
    effectBase[0].changes = [
      _IntuitionActionBase.ChangeHelper.addChange(`@scale.${id}.die`, 20, "system.skills.arc.bonuses.check"),
      ...artChanges,
    ];
    return effectBase;
  }

}
