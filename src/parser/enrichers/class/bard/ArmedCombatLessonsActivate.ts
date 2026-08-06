import DDBEnricherData from "../../data/DDBEnricherData";

export default class ArmedCombatLessonsActivate extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "special",
      activationCondition: "You make a weapon attack",
      addItemConsume: true,
      itemConsumeTargetName: "Bardic Inspiration",
      data: {
        description: {
          chatFlavor: "Add your Bardic Inspiration die to the attack or damage roll, and gain the benefits of your chosen Fighting Style for 10 minutes.",
        },
        duration: {
          units: "minute",
          value: "10",
        },
        roll: {
          prompt: false,
          visible: false,
          formula: "@scale.road.travelers-tricks",
          name: "Bonus to attack or damage roll",
        },
      },
    };
  }

}
