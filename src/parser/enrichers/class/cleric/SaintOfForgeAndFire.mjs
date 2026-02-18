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
          DDBEnricherData.ChangeHelper.damageResistanceChange("bludgeoning"),
          DDBEnricherData.ChangeHelper.damageResistanceChange("piercing"),
          DDBEnricherData.ChangeHelper.damageResistanceChange("slashing"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("mgc", 20, "system.traits.dr.bypasses"),
        ],
      },
    ];
  }

}
