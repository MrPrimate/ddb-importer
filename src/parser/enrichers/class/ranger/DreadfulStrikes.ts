import DDBEnricherData from "../../data/DDBEnricherData";

export default class DreadfulStrikes extends DDBEnricherData {

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
          parts: [DDBEnricherData.basicDamagePart({ customFormula: "@scale.fey-wanderer.dreadful-strikes", types: ["psychic"] })],
        },
      },
    };
  }

}
