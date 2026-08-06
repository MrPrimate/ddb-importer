import DDBEnricherData from "../../data/DDBEnricherData";

export default class DarkBargain extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "bonus",
      addItemConsume: true,
      itemConsumeTargetName: "Bardic Inspiration",
      data: {
        description: {
          chatFlavor: "Gain the benefits of your chosen Eldritch Invocation for 10 minutes, taking Necrotic damage equal to the Bardic Inspiration die roll.",
        },
        duration: {
          units: "minute",
          value: "10",
        },
        roll: {
          prompt: false,
          visible: false,
          formula: "@scale.road.travelers-tricks",
          name: "Necrotic damage taken",
        },
      },
    };
  }

}
