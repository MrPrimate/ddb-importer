import DDBEnricherData from "../../data/DDBEnricherData";

export default class AcrobaticsLessons extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      activationType: "special",
      activationCondition: "You or an ally within 60 ft makes a Dexterity saving throw",
      addItemConsume: true,
      itemConsumeTargetName: "Bardic Inspiration",
      data: {
        range: {
          value: 60,
          units: "ft",
        },
        roll: {
          prompt: false,
          visible: false,
          formula: "@scale.road.travelers-tricks",
          name: "Bonus to saving throw",
        },
      },
    };
  }

}
