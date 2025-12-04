/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class ShapeShift extends DDBEnricherData {

  get activity() {
    return {
      targetType: "self",
      data: {
        duration: {
          units: "permanent",
        },
      },
    };
  }

  get effects() {
    return [
      {
        name: "Shape Shifted",
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange(`${CONFIG.Dice.D20Roll.ADV_MODE.ADVANTAGE}`, 20, "system.abilities.cha.check.roll.mode"),
        ],
      },
    ];
  }

}
