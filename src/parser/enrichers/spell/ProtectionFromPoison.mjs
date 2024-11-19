/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class ProtectionFromPoison extends DDBEnricherData {

  get effects() {
    return [
      {
        changes: [
          DDBEnricherData.generateUnsignedAddChange("poison", 20, "system.traits.dr.value"),
        ],
      },
    ];
  }

}
