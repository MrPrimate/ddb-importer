/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class ShieldOfFaith extends DDBEnricherData {

  get effects() {
    return [
      {
        changes: [
          DDBEnricherData.generateSignedAddChange("5", 20, "system.attributes.ac.bonus"),
        ],
        tokenMagicChanges: [
          DDBEnricherData.generateTokenMagicFXChange("bloom"),
        ],
      },
    ];
  }

}
