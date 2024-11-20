/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class Stoneskin extends DDBEnricherData {

  get effects() {
    return [
      {
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("bludgeoning", 0, "system.traits.dr.value"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("piercing", 0, "system.traits.dr.value"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("slashing", 0, "system.traits.dr.value"),
          // {
          //   key: "system.traits.dr.bypass",
          //   value: "mgc",
          //   mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          //   priority: 0,
          // },
        ],
      },
    ];
  }

}
