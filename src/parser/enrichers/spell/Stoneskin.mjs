/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class Stoneskin extends DDBEnricherData {

  get effects() {
    return [
      {
        changes: [
          DDBEnricherData.generateUnsignedAddChange("bludgeoning", 0, "system.traits.dr.value"),
          DDBEnricherData.generateUnsignedAddChange("piercing", 0, "system.traits.dr.value"),
          DDBEnricherData.generateUnsignedAddChange("slashing", 0, "system.traits.dr.value"),
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
