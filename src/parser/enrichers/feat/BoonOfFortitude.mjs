/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class BoonOfFortitude extends DDBEnricherData {

  get activity() {
    return {
      name: "Healing Bonus",
      type: "heal",
      targetType: "self",
      activationType: "special",
      activationCondition: "Once a turn",
      data: {
        healing: DDBEnricherData.basicDamagePart({ bonus: "@abilities.con.mod", type: "healing" }),
      },
    };
  }

}
