/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class AuraOfLife extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get effects() {
    return [
      {
        changes: [
          DDBEnricherData.generateUnsignedAddChange("necrotic", 20, "system.traits.dr.value"),
        ],
      },
    ];
  }

}
