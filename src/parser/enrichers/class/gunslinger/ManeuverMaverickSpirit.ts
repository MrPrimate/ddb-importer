import DDBEnricherData from "../../data/DDBEnricherData";

export default class ManeuverMaverickSpirit extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "special",
      activationCondition: "Once per turn, when you fail an INT, WIS, or CHA check or saving throw",
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
