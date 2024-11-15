/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class BladeWard extends DDBEnricherData {

  get effects() {
    if (this.is2014) {
      return [
        {
          changes: [
            DDBEnricherData.generateUnsignedAddChange("bludgeoning", 10, "system.traits.dr.value"),
            DDBEnricherData.generateUnsignedAddChange("slashing", 10, "system.traits.dr.value"),
            DDBEnricherData.generateUnsignedAddChange("piercing", 10, "system.traits.dr.value"),
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
