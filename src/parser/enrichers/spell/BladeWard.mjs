/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../mixins/DDBEnricherMixin.mjs";

export default class BladeWard extends DDBEnricherMixin {

  get effects() {
    if (this.is2014) {
      return [
        {
          changes: [
            DDBEnricherMixin.generateUnsignedAddChange("bludgeoning", 10, "system.traits.dr.value"),
            DDBEnricherMixin.generateUnsignedAddChange("slashing", 10, "system.traits.dr.value"),
            DDBEnricherMixin.generateUnsignedAddChange("piercing", 10, "system.traits.dr.value"),
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
