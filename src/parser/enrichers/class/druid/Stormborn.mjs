/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class Stormborn extends DDBEnricherData {

  get effects() {
    return [
      DDBEnricherData.ChangeHelper.upgradeChange("@attributes.movement.walk", 20, "system.attributes.movement.fly"),
      DDBEnricherData.ChangeHelper.unsignedAddChange("cold", 20, "system.traits.dr.value"),
      DDBEnricherData.ChangeHelper.unsignedAddChange("lightning", 20, "system.traits.dr.value"),
      DDBEnricherData.ChangeHelper.unsignedAddChange("thunder", 20, "system.traits.dr.value"),
    ];
  }

}
