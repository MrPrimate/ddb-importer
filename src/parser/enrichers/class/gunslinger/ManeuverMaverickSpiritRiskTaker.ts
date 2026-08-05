import DDBEnricherData from "../../data/DDBEnricherData";

export default class ManeuverMaverickSpiritRiskTaker extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "special",
      activationCondition: "Once per turn, when you fail an INT, WIS, or CHA check or save (no Risk Die expended)",
      data: {
        roll: {
          prompt: false,
          visible: true,
          formula: "1d6",
          name: "Risk Taker Die",
        },
      },
    };
  }

}
