/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class ForceBallista extends DDBEnricherData {

  get type() {
    return "attack";
  }

  get activity() {
    return {
      noTemplate: true,
      activationType: "bonus",
      activationCondition: "Only if the artificer uses a bonus action, in addition the cannon can also move",
      data: {
        range: {
          value: 120,
          long: null,
          units: "ft",
        },
        damage: {
          parts: [DDBEnricherData.basicDamagePart({
            bonus: "",
            type: "force",
          })],
        },
      },
    };
  }

}
