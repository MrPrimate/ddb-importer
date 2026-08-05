import DDBEnricherData from "../../data/DDBEnricherData";

export default class SilverBulwark extends DDBEnricherData {

  get useDefaultAdditionalActivities() {
    return true;
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Silver Bulwark",
        options: {
          durationRounds: 1,
          description: "Resistance to Bludgeoning, Piercing and Slashing damage until the start of your next turn.",
        },
        daeSpecialDurations: ["turnStartSource"],
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("bludgeoning", 20, "system.traits.dr.value"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("piercing", 20, "system.traits.dr.value"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("slashing", 20, "system.traits.dr.value"),
        ],
      },
    ];
  }

}
