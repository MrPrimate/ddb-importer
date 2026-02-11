/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class ArcaneDeflection extends DDBEnricherData {

  get effects() {
    return [
      {
        changes: [
          DDBEnricherData.ChangeHelper.signedAddChange("2", 20, "system.attributes.ac.bonus"),
          DDBEnricherData.ChangeHelper.signedAddChange("4", 20, "system.bonuses.abilities.save"),
        ],
        tokenMagicChanges: [
          DDBEnricherData.ChangeHelper.tokenMagicFXChange("water-field"),
        ],
        data: {
          "flags.dae.specialDuration": ["1Save", "1Attack"],
        },
        options: {
          durationSeconds: 6,
        },
      },
    ];
  }

}
