import DDBEnricherData from "../../data/DDBEnricherData";

export default class WardingTrick extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "ally",
      activationType: "action",
      addItemConsume: true,
      itemConsumeTargetName: "Bardic Inspiration",
      data: {
        description: {
          chatFlavor: "The ward lasts for as long as you maintain Concentration, up to 10 minutes.",
        },
        range: {
          value: 60,
          units: "ft",
        },
        duration: {
          units: "minute",
          value: "10",
        },
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "@scale.road.travelers-tricks + max(1, @abilities.wis.mod)",
          types: ["temphp"],
        }),
      },
    };
  }

}
