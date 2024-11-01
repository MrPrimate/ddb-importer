/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../DDBEnricherMixin.js";

export default class BoonOfFortitude extends DDBEnricherMixin {

  get activity() {
    return {
      name: "Healing Bonus",
      type: "heal",
      targetType: "self",
      activationType: "special",
      activationCondition: "Once a turn",
      data: {
        healing: DDBEnricherMixin.basicDamagePart({ bonus: "@abilities.con.mod", type: "healing" }),
      },
    };
  }

}
