import DDBEnricherData from "../../data/DDBEnricherData";

export default class ManeuverSkinOfYourTeeth extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "reaction",
      activationCondition: "When a creature you can see hits you with an attack roll",
      data: {
        roll: {
          prompt: false,
          visible: true,
          formula: "1@scale.gunslinger.risk.die",
          name: "Risk Die",
        },
      },
    };
  }

}
