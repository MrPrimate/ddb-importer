/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class WarriorOfTheGods extends DDBEnricherData {
  get type() {
    return "heal";
  }

  get activity() {
    return {
      name: "Heal",
      targetType: "self",
      rangeSelf: true,
      itemConsumeValue: "1",
      addScalingMode: "amount",
      addConsumptionScalingMax: "@item.uses.value",
      data: {
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "(@scaling)d12",
          types: ["healing"],
        }),
      },
    };
  }

  get override() {
    return {
      data: {
        "system.uses": this._getUsesWithSpent({
          type: "class",
          name: "Warrior of the Gods: Expend Dice",
          max: "@scale.zealot.warrior-of-the-gods.number",
          period: "lr",
        }),
      },
    };
  }

}
