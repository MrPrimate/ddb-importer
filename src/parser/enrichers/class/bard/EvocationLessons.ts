import DDBEnricherData from "../../data/DDBEnricherData";

export default class EvocationLessons extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "special",
      activationCondition: "You cast your chosen damage-dealing spell",
      addItemConsume: true,
      itemConsumeTargetName: "Bardic Inspiration",
      data: {
        description: {
          chatFlavor: "Change the spell's damage type to Acid, Cold, Fire, Lightning, or Thunder and add the rolled bonus to its damage.",
        },
        roll: {
          prompt: false,
          visible: false,
          formula: "@scale.road.travelers-tricks + max(1, @abilities.wis.mod)",
          name: "Bonus spell damage",
        },
      },
    };
  }

}
