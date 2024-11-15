/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class FireShield extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get effects() {
    return [
      {
        name: "Cold Shield",
        changes: [
          DDBEnricherData.generateUnsignedAddChange("fire", 0, "system.traits.dr.value"),
        ],
      },
      {
        name: "Warm Shield",
        changes: [
          DDBEnricherData.generateUnsignedAddChange("cold", 0, "system.traits.dr.value"),
        ],
      },
    ];
  }

}
