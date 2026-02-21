import Generic from "../Generic";
import type { DDBEffectHint } from "../../data/types";

export default class EmboldeningBond extends Generic {

  get effects(): DDBEffectHint[] {
    return this.isAction
      ? [
        {
          changes: [
            Generic.ChangeHelper.addChange("1d4", 2, "system.bonuses.abilities.save"),
            Generic.ChangeHelper.addChange("1d4", 2, "system.bonuses.abilities.check"),
            Generic.ChangeHelper.addChange("1d4", 2, "system.bonuses.mwak.attack"),
            Generic.ChangeHelper.addChange("1d4", 2, "system.bonuses.rwak.attack"),
            Generic.ChangeHelper.addChange("1d4", 2, "system.bonuses.msak.attack"),
            Generic.ChangeHelper.addChange("1d4", 2, "system.bonuses.rsak.attack"),
          ],
        },
      ]
      : [];
  }
}
