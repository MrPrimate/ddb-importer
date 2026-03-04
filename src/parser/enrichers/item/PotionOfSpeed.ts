import DDBEnricherData from "../data/DDBEnricherData";

export default class PotionOfSpeed extends DDBEnricherData {

  get effects(): IDDBEffectHint[] {
    return [
      {
        changes: [
          DDBEnricherData.ChangeHelper.signedAddChange("2", 20, "system.attributes.ac.bonus"),
          DDBEnricherData.ChangeHelper.unsignedAddChange(`${CONFIG.Dice.D20Roll.ADV_MODE.ADVANTAGE}`, 20, "system.abilities.dex.save.roll.mode"),
          DDBEnricherData.ChangeHelper.customChange("*2", 30, "system.attributes.movement.all"),
        ],
      },
    ];
  }

}
