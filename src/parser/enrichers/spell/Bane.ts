import DDBEnricherData from "../data/DDBEnricherData";

export default class Bane extends DDBEnricherData {

  get effects(): IDDBEffectHint[] {
    return [
      {
        changes: [
          DDBEnricherData.ChangeHelper.signedAddChange("-1d4", 0, "system.bonuses.mwak.attack"),
          DDBEnricherData.ChangeHelper.signedAddChange("-1d4", 0, "system.bonuses.rwak.attack"),
          DDBEnricherData.ChangeHelper.signedAddChange("-1d4", 0, "system.bonuses.msak.attack"),
          DDBEnricherData.ChangeHelper.signedAddChange("-1d4", 0, "system.bonuses.rsak.attack"),
          DDBEnricherData.ChangeHelper.signedAddChange("-1d4", 20, "system.bonuses.abilities.save"),
        ],
      },
    ];
  }

}
