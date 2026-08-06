import DDBEnricherData from "../../data/DDBEnricherData";

export default class HuntingLessons extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      activationType: "bonus",
      addItemConsume: true,
      itemConsumeTargetName: "Bardic Inspiration",
      data: {
        description: {
          chatFlavor: "Mark a creature you can see within 90 ft as your quarry; while you concentrate (up to 1 hour), your weapon attacks against it deal extra damage equal to your Bardic Inspiration die.",
        },
        range: {
          value: 90,
          units: "ft",
        },
        duration: {
          units: "hour",
          value: "1",
        },
        roll: {
          prompt: false,
          visible: false,
          formula: "@scale.road.travelers-tricks",
          name: "Extra weapon damage vs quarry",
        },
      },
    };
  }

}
