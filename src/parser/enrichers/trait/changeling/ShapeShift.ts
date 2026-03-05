import DDBEnricherData from "../../data/DDBEnricherData";

export default class ShapeShift extends DDBEnricherData {

  get activity(): IDDBActivityData {
    return {
      targetType: "self",
      data: {
        duration: {
          units: "permanent",
        },
      },
    };
  }

  get effects(): IDDBEffectHint[] {
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
