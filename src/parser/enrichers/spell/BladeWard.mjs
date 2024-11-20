/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class BladeWard extends DDBEnricherData {

  get effects() {
    if (this.is2014) {
      return [
        {
          changes: [
            DDBEnricherData.ChangeHelper.unsignedAddChange("bludgeoning", 10, "system.traits.dr.value"),
            DDBEnricherData.ChangeHelper.unsignedAddChange("slashing", 10, "system.traits.dr.value"),
            DDBEnricherData.ChangeHelper.unsignedAddChange("piercing", 10, "system.traits.dr.value"),
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
