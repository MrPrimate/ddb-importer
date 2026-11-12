import DDBEnricherData from "../../data/DDBEnricherData";

export default class TacticalMind extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      name: "Add Bonus",
      activationType: "special",
      activationCondition: "When you fail an ability check",
      data: {
        roll: {
          prompt: false,
          visible: false,
          formula: "1d10",
          name: "Roll Ability Check Bonus",
        },
      },
    };
  }

}
