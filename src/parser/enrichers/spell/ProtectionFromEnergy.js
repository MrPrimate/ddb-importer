/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../DDBEnricherMixin.js";

export default class ProtectionFromEnergy extends DDBEnricherMixin {

  get effects() {
    return ["Acid", "Cold", "Fire", "Lightning", "Thunder"].map((element) => {
      return {
        name: `Protection from ${element}`,
        changes: [
          DDBEnricherMixin.generateUnsignedAddChange(element.toLowerCase(), 0, "system.traits.dr.value"),
        ],
      };
    });
  }

}
