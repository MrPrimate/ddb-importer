/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class ProtectionFromEnergy extends DDBEnricherData {

  get effects() {
    return ["Acid", "Cold", "Fire", "Lightning", "Thunder"].map((element) => {
      return {
        name: `Protection from ${element}`,
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange(element.toLowerCase(), 0, "system.traits.dr.value"),
        ],
      };
    });
  }

}
