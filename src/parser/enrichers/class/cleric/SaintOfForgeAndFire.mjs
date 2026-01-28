/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class SaintOfForgeAndFire extends DDBEnricherData {
  get effects() {
    return [
      {
        name: "Saint of Forge and Fire: Wearing Heavy Armor",
        options: {
          transfer: true,
          disabled: false,
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("bludgeoning", 20, "system.traits.dr.value"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("piercing", 20, "system.traits.dr.value"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("slashing", 20, "system.traits.dr.value"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("mgc", 20, "system.traits.dr.bypasses"),
        ],
      },
    ];
  }

}
