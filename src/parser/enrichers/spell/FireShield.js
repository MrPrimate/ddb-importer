/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../DDBEnricherMixin.js";

export default class FireShield extends DDBEnricherMixin {

  get type() {
    return "utility";
  }

  get effects() {
    return [
      {
        name: "Cold Shield",
        changes: [
          DDBEnricherMixin.generateUnsignedAddChange("fire", 0, "system.traits.dr.value"),
        ],
      },
      {
        name: "Warm Shield",
        changes: [
          DDBEnricherMixin.generateUnsignedAddChange("cold", 0, "system.traits.dr.value"),
        ],
      },
    ];
  }

}
