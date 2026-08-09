import DDBEnricherData from "../../data/DDBEnricherData";

export default class Ricochet extends DDBEnricherData {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "bonus",
      activationCondition: "You miss with a ranged attack using a weapon",
      addItemConsume: true,
      itemConsumeTargetName: "Risk",
      data: {
        roll: {
          prompt: false,
          visible: true,
          formula: "1@scale.gunslinger.risk.die",
          name: "Risk Die (add to rerolled attack)",
        },
      },
    };
  }

  override get override(): IDDBOverrideData {
    return {
      data: { name: "Ricochet" },
    };
  }

}
