import DDBEnricherData from "../../data/DDBEnricherData";

export default class ShadowMass extends DDBEnricherData {

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    if (this.isAction) return [];
    return [
      {
        name: "Shadow Mass",
        ignoreTransfer: true,
        options: {
          transfer: true,
          disabled: true,
          description: "While in your Umbral Form, you gain a fly speed equal to your normal speed, you can hover, and you have resistance to bludgeoning, piercing, and slashing damage from nonmagical attacks.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("@attributes.movement.speeds.walk", 20, "system.attributes.movement.speeds.fly"),
          DDBEnricherData.ChangeHelper.overrideChange("true", 20, "system.attributes.movement.hover"),
          DDBEnricherData.ChangeHelper.damageResistanceChange("piercing"),
          DDBEnricherData.ChangeHelper.damageResistanceChange("slashing"),
          DDBEnricherData.ChangeHelper.damageResistanceChange("bludgeoning"),
        ],
      },
    ];
  }

}
