/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../../DDBEnricherMixin.js";

export default class Stormborn extends DDBEnricherMixin {

  get effects() {
    return [
      this.movementChange("@attributes.movement.walk", 20, "system.attributes.movement.fly"),
      DDBEnricherMixin.generateUnsignedAddChange("cold", 20, "system.traits.dr.value"),
      DDBEnricherMixin.generateUnsignedAddChange("lightning", 20, "system.traits.dr.value"),
      DDBEnricherMixin.generateUnsignedAddChange("thunder", 20, "system.traits.dr.value"),
    ];
  }

}
