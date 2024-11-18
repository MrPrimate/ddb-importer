/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class Bless extends DDBEnricherData {

  get effects() {
    return [
      {
        options: {
          durationSeconds: 60,
        },
        changes: [
          DDBEnricherData.generateSignedAddChange("+1d4", 0, "system.bonuses.mwak.attack"),
          DDBEnricherData.generateSignedAddChange("+1d4", 0, "system.bonuses.rwak.attack"),
          DDBEnricherData.generateSignedAddChange("+1d4", 0, "system.bonuses.msak.attack"),
          DDBEnricherData.generateSignedAddChange("+1d4", 0, "system.bonuses.rsak.attack"),
          DDBEnricherData.generateSignedAddChange("+1d4", 20, "system.bonuses.abilities.save"),
        ],
        tokenMagicChanges: [
          DDBEnricherData.generateTokenMagicFXChange("bloom"),
        ],
      },
    ];
  }

}
