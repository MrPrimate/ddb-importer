import DDBEnricherData from "../../data/DDBEnricherData";

export default class VedalkenDispassion extends DDBEnricherData {

  get effects(): IDDBEffectHint[] {
    return [
      {
        options: {
          transfer: false,
        },
        changes: ["int", "wis", "cha"].map((ability) =>
          DDBEnricherData.ChangeHelper.unsignedAddChange(`${CONFIG.Dice.D20Roll.ADV_MODE.ADVANTAGE}`, 20, `system.abilities.${ability}.save.roll.mode`),
        ),
      },
    ];
  }

}
