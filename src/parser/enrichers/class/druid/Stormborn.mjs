/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class Stormborn extends DDBEnricherData {

  get effects() {
    return [
      DDBEnricherData.ChangeHelper.upgradeChange("@attributes.movement.walk", 20, "system.attributes.movement.fly"),
      DDBEnricherData.ChangeHelper.damageResistanceChange("cold"),
      DDBEnricherData.ChangeHelper.damageResistanceChange("lightning"),
      DDBEnricherData.ChangeHelper.damageResistanceChange("thunder"),
    ];
  }

}
