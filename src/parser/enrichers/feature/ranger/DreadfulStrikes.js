/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../../DDBEnricherMixin.js";

export default class DreadfulStrikes extends DDBEnricherMixin {

  get type() {
    return "damage";
  }

  get activity() {
    return {
      targetType: "creature",
      activationType: "special",
      activationCondition: "Once per turn",
      data: {
        damage: {
          parts: [DDBEnricherMixin.basicDamagePart({ customFormula: "@scale.fey-wanderer.dreadful-strikes", types: ["psychic"] })],
        },
      },
    };
  }

}
