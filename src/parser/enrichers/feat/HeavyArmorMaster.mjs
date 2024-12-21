/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class HeavyArmorMaster extends DDBEnricherData {

  get type() {
    return "none";
  }


  get effects() {

    const dmgResistance = this.is2014
      ? "-3"
      : "-@prof";

    const changes = [
      DDBEnricherData.ChangeHelper.unsignedAddChange(dmgResistance, 20, "system.traits.dm.amount.bludgeoning"),
      DDBEnricherData.ChangeHelper.unsignedAddChange(dmgResistance, 20, "system.traits.dm.amount.slashing"),
      DDBEnricherData.ChangeHelper.unsignedAddChange(dmgResistance, 20, "system.traits.dm.amount.piercing"),
    ];
    if (this.is2014) {
      changes.push(
        DDBEnricherData.ChangeHelper.unsignedAddChange("mgc", 20, "system.traits.dm.bypasses"),
      );
    }
    const effects = [
      {
        options: {
          transfer: true,
        },
        changes,
      },
    ];

    return effects;
  }

}
