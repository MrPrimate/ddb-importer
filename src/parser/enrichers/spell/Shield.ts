import DDBEnricherData from "../data/DDBEnricherData";

export default class Shield extends DDBEnricherData {

  get effects(): IDDBEffectHint[] {
    return [
      {
        changes: [
          DDBEnricherData.ChangeHelper.signedAddChange("5", 20, "system.attributes.ac.bonus"),
        ],
        tokenMagicChanges: [
          DDBEnricherData.ChangeHelper.tokenMagicFXChange("water-field"),
        ],
        data: {
          "flags.dae.specialDuration": ["turnStart"],
        },
      },
    ];
  }

}
