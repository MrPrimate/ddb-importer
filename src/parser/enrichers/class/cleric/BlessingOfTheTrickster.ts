import DDBEnricherData from "../../data/DDBEnricherData";

export default class BlessingOfTheTrickster extends DDBEnricherData {

  get effects(): IDDBEffectHint[] {
    return [
      {
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange(`${CONFIG.Dice.D20Roll.ADV_MODE.ADVANTAGE}`, 20, "system.skills.ste.roll.mode"),
        ],
      },
    ];
  }

}
