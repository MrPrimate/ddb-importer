import DDBEnricherData from "../../data/DDBEnricherData";

export default class Stormborn extends DDBEnricherData {

  get effects(): IDDBEffectHint[] {
    return [
      DDBEnricherData.ChangeHelper.upgradeChange("@attributes.movement.walk", 20, "system.attributes.movement.fly"),
      DDBEnricherData.ChangeHelper.damageResistanceChange("cold"),
      DDBEnricherData.ChangeHelper.damageResistanceChange("lightning"),
      DDBEnricherData.ChangeHelper.damageResistanceChange("thunder"),
    ];
  }

}
