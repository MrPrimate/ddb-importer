import DDBEnricherData from "../../data/DDBEnricherData";

export default class DeftDeflection extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "ally",
      targetCount: 1,
      activationType: "reaction",
      activationCondition: "An ally within 30 feet is hit by an attack; you must hold a Ranged weapon",
      addItemConsume: true,
      itemConsumeTargetName: "Risk",
      rangeType: "ft",
      rangeValue: 30,
      data: {
        roll: {
          prompt: false,
          visible: true,
          formula: "1@scale.gunslinger.risk.die",
          name: "Risk Die (add to ally AC vs attack)",
        },
      },
    };
  }

  get override(): IDDBOverrideData {
    return {
      data: { name: "Deft Deflection" },
    };
  }

}
