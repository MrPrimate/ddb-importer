/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class Stormborn extends DDBEnricherData {

  get effects() {
    return [
      this.movementChange("@attributes.movement.walk", 20, "system.attributes.movement.fly"),
      DDBEnricherData.generateUnsignedAddChange("cold", 20, "system.traits.dr.value"),
      DDBEnricherData.generateUnsignedAddChange("lightning", 20, "system.traits.dr.value"),
      DDBEnricherData.generateUnsignedAddChange("thunder", 20, "system.traits.dr.value"),
    ];
  }

}
