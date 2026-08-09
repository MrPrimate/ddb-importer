import DDBEnricherData from "../../data/DDBEnricherData";

export default class MagicBullet extends DDBEnricherData {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "bonus",
      activationCondition: "You make a spell attack roll",
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

  override get override(): IDDBOverrideData {
    return {
      data: { name: "Magic Bullet" },
    };
  }

}
