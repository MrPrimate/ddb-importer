/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class DeflectAttack extends DDBEnricherData {

  get type() {
    return "heal";
  }

  get activity() {
    return {
      name: "Reduce Damage",
      targetType: "self",
      type: "heal",
      data: {
        "consumption.targets": [],
        // roll: {
        //   prompt: false,
        //   visible: false,
        //   formula: "1d10 + @abilities.dex.mod + @classes.monk.levels",
        //   name: "Reduce Damage Amount",
        // },
        healing: DDBEnricherData.basicDamagePart({
          number: 1,
          denomination: 10,
          bonus: "@abilities.dex.mod + @classes.monk.levels",
          types: ["healing"],
        }),
      },
    };
  }

}
