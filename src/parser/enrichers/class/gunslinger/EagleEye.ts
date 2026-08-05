import DDBEnricherData from "../../data/DDBEnricherData";

export default class EagleEye extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "special",
      activationCondition: "Once per turn, when you miss with a ranged attack roll",
      addItemConsume: true,
      itemConsumeTargetName: "Risk",
      data: {
        roll: {
          prompt: false,
          visible: true,
          formula: "1@scale.gunslinger.risk.die",
          name: "Risk Die (add to attack roll)",
        },
      },
    };
  }

  get override(): IDDBOverrideData {
    return {
      data: { name: "Eagle Eye" },
    };
  }

}
