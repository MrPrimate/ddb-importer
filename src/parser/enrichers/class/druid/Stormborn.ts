import DDBEnricherData from "../../data/DDBEnricherData";

export default class Stormborn extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("@attributes.movement.speeds.walk", 20, "system.attributes.movement.speeds.fly"),
          DDBEnricherData.ChangeHelper.damageResistanceChange("cold"),
          DDBEnricherData.ChangeHelper.damageResistanceChange("lightning"),
          DDBEnricherData.ChangeHelper.damageResistanceChange("thunder"),
        ],
      },
    ];
  }

}
