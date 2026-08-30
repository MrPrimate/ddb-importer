import DDBEnricherData from "../../data/DDBEnricherData";

export default class SilverBulwark extends DDBEnricherData {

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Silver Bulwark",
        options: {
          expiry: "sourceStart",
          description: "Resistance to Bludgeoning, Piercing and Slashing damage until the start of your next turn.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("bludgeoning", 20, "system.traits.dr.value"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("piercing", 20, "system.traits.dr.value"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("slashing", 20, "system.traits.dr.value"),
        ],
      },
    ];
  }

}
