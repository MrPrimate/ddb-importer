/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class Stoneskin extends DDBEnricherData {

  get effects() {
    return [
      {
        changes: [
          DDBEnricherData.ChangeHelper.damageResistanceChange("bludgeoning", 0),
          DDBEnricherData.ChangeHelper.damageResistanceChange("piercing", 0),
          DDBEnricherData.ChangeHelper.damageResistanceChange("slashing", 0),
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
