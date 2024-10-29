/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../DDBEnricherMixin.js";

export default class BolsteringPerformance extends DDBEnricherMixin {

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
        healing: DDBEnricherMixin.basicDamagePart({ bonus: "@details.level + @abilities.wis.mod", type: "temphp" }),
      },
    };
  }

}
