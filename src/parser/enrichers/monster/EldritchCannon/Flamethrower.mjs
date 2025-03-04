/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class Flamethrower extends DDBEnricherData {

  get type() {
    return "save";
  }

  get activity() {
    return {
      activationType: "bonus",
      activationCondition: "Only if the artificer uses a bonus action, in addition the cannon can also move",
      data: {
        damage: {
          onSave: "half",
          parts: [DDBEnricherData.basicDamagePart({
            bonus: "",
            type: "fire",
          })],
        },
      },
    };
  }

}
