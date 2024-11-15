/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class BolsteringPerformance extends DDBEnricherData {

  get activity() {
    return {
      name: "Temporary Hit Points",
      type: "heal",
      targetType: "self",
      activationType: "special",
      activationCondition: "End of a short or long rest",
      data: {
        range: {
          value: 30,
          units: "feet",
        },
        healing: DDBEnricherData.basicDamagePart({ bonus: "@details.level + @abilities.wis.mod", type: "temphp" }),
      },
    };
  }

}
