import DDBEnricherData from "../data/DDBEnricherData";

export default class EnlargeReduce extends DDBEnricherData {

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Enlarged",
        options: {
          durationSeconds: 60,
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1d4", 20, "system.bonuses.mwak.damage"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("1d4", 20, "system.bonuses.rwak.damage"),
          DDBEnricherData.ChangeHelper.advantageAbilityCheckChange("str"),
          DDBEnricherData.ChangeHelper.advantageAbilitySaveChange("str"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "token.width"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "token.height"),
        ],
        atlChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "ATL.width"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "ATL.height"),
        ],
      },
      {
        name: "Reduced",
        options: {
          durationSeconds: 60,
        },
        changes: [
          DDBEnricherData.ChangeHelper.subtractChange("1d4", 20, "system.bonuses.mwak.damage"),
          DDBEnricherData.ChangeHelper.subtractChange("1d4", 20, "system.bonuses.rwak.damage"),
          DDBEnricherData.ChangeHelper.disadvantageAbilityCheckChange("str"),
          DDBEnricherData.ChangeHelper.disadvantageAbilitySaveChange("str"),
          DDBEnricherData.ChangeHelper.subtractChange("1", 20, "token.width"),
          DDBEnricherData.ChangeHelper.subtractChange("1", 20, "token.height"),
        ],
        atlChanges: [
          DDBEnricherData.ChangeHelper.subtractChange("1", 20, "ATL.width"),
          DDBEnricherData.ChangeHelper.subtractChange("1", 20, "ATL.height"),
        ],
      },
    ];
  }

}
