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
          DDBEnricherData.ChangeHelper.unsignedAddChange(`${CONFIG.Dice.D20Roll.ADV_MODE.ADVANTAGE}`, 20, "system.abilities.str.check.roll.mode"),
          DDBEnricherData.ChangeHelper.unsignedAddChange(`${CONFIG.Dice.D20Roll.ADV_MODE.ADVANTAGE}`, 20, "system.abilities.str.save.roll.mode"),
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
          DDBEnricherData.ChangeHelper.unsignedAddChange(`${CONFIG.Dice.D20Roll.ADV_MODE.DISADVANTAGE}`, 20, "system.abilities.str.check.roll.mode"),
          DDBEnricherData.ChangeHelper.unsignedAddChange(`${CONFIG.Dice.D20Roll.ADV_MODE.DISADVANTAGE}`, 20, "system.abilities.str.save.roll.mode"),
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
