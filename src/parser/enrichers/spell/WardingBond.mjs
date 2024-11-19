/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class WardingBond extends DDBEnricherData {

  get effects() {
    const damageChanges = DDBEnricherData.allDamageTypes().map((type) => {
      return DDBEnricherData.generateUnsignedAddChange(type, 0, "system.traits.dr.value");
    });
    return {
      changes: [
        ...damageChanges,
        DDBEnricherData.generateSignedAddChange("1", 20, "system.attributes.ac.bonus"),
        DDBEnricherData.generateSignedAddChange("1", 20, "system.bonuses.abilities.save"),
      ],
    };
  }

}
