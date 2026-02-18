/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class BladeWard extends DDBEnricherData {

  get effects() {
    if (this.is2014) {
      return [
        {
          changes: [
            DDBEnricherData.ChangeHelper.damageResistanceChange("bludgeoning", 10),
            DDBEnricherData.ChangeHelper.damageResistanceChange("slashing", 10),
            DDBEnricherData.ChangeHelper.damageResistanceChange("piercing", 10),
          ],
          data: {
            "flags.dae.specialDuration": ["turnEnd"],
          },
        },
      ];
    } else {
      return [

      ];
    }
  }

}
