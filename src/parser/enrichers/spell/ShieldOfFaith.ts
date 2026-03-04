import DDBEnricherData from "../data/DDBEnricherData";

export default class ShieldOfFaith extends DDBEnricherData {

  get effects(): IDDBEffectHint[] {
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
