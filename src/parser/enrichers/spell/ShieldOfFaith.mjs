/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class ShieldOfFaith extends DDBEnricherData {

  get effects() {
    return [
      {
        changes: [
          DDBEnricherData.ChangeHelper.signedAddChange("2", 20, "system.attributes.ac.bonus"),
        ],
        tokenMagicChanges: [
          DDBEnricherData.ChangeHelper.tokenMagicFXChange("bloom"),
        ],
      },
    ];
  }

}
