import DDBEnricherData from "../../data/DDBEnricherData";

export default class SpiritProjectionProjectSpirit extends DDBEnricherData {

  get effects(): IDDBEffectHint[] {
    return [{
      name: "Projecting Spirit",
      options: {
        durationSeconds: 3600,
      },
      changes: [
        DDBEnricherData.ChangeHelper.damageResistanceChange("bludgeoning"),
        DDBEnricherData.ChangeHelper.damageResistanceChange("piercing"),
        DDBEnricherData.ChangeHelper.damageResistanceChange("slashing"),
        DDBEnricherData.ChangeHelper.upgradeChange("@attributes.movement.walk", 20, "system.attributes.movement.fly"),
        DDBEnricherData.ChangeHelper.upgradeChange("true", 20, "system.attributes.movement.hover"),
      ],
    }];
  }

}
