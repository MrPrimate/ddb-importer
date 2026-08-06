import DDBEnricherData from "../../data/DDBEnricherData";

export default class ThunderousAura extends DDBEnricherData {

  get effects(): IDDBEffectHint[] {
    return [{
      name: "Thunderous Aura",
      options: {
        transfer: true,
        description: "You and your allies have Immunity to Thunder damage while in your Aura of Protection. When you cast Find Steed, your Faithful Steed's attacks can deal Thunder damage instead of their typical damage.",
      },
      changes: [
        DDBEnricherData.ChangeHelper.unsignedAddChange("thunder", 20, "system.traits.di.value"),
      ],
    }];
  }

}
