import DDBEnricherData from "../../data/DDBEnricherData";

export default class SecondSkin extends DDBEnricherData {

  get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  get effects(): IDDBEffectHint[] {
    if (this.isAction) return [];
    return [
      {
        name: "Second Skin",
        ignoreTransfer: true,
        options: {
          transfer: true,
          disabled: true,
          description: "While in dim light or darkness you have a +2 bonus to AC and Resistance to Bludgeoning, Piercing, and Slashing damage.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("2", 20, "system.attributes.ac.bonus"),
          DDBEnricherData.ChangeHelper.damageResistanceChange("bludgeoning"),
          DDBEnricherData.ChangeHelper.damageResistanceChange("piercing"),
          DDBEnricherData.ChangeHelper.damageResistanceChange("slashing"),
        ],
      },
    ];
  }

}
