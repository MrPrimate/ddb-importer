import DDBEnricherData from "../../data/DDBEnricherData";

export default class ArcaneDeflection extends DDBEnricherData {

  get effects(): IDDBEffectHint[] {
    return [
      {
        changes: [
          DDBEnricherData.ChangeHelper.signedAddChange("2", 20, "system.attributes.ac.bonus"),
          DDBEnricherData.ChangeHelper.signedAddChange("4", 20, "system.bonuses.abilities.save"),
        ],
        tokenMagicChanges: [
          DDBEnricherData.ChangeHelper.tokenMagicFXChange("water-field"),
        ],
        daeSpecialDurations: ["1Save", "1Attack"],
        options: {
          durationSeconds: 6,
        },
      },
    ];
  }

}
