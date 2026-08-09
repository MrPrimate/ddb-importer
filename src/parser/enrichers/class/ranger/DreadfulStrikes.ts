import DDBEnricherData from "../../data/DDBEnricherData";

export default class DreadfulStrikes extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
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
