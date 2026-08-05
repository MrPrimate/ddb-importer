import DDBEnricherData from "../../data/DDBEnricherData";

export default class ManeuverSkinOfYourTeethRiskTaker extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "reaction",
      activationCondition: "A creature you can see hits you with an attack roll (no Risk Die expended)",
      data: {
        roll: {
          prompt: false,
          visible: true,
          formula: "1d6",
          name: "Risk Taker Die (add to AC vs attack)",
        },
      },
    };
  }

}
