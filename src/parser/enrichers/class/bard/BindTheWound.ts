import DDBEnricherData from "../../data/DDBEnricherData";

export default class BindTheWound extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      activationType: "reaction",
      activationCondition: "You or an ally within 5 ft of you receives healing",
      addItemConsume: true,
      itemConsumeTargetName: "Bardic Inspiration",
      data: {
        range: {
          value: 5,
          units: "ft",
        },
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "@scale.road.travelers-tricks + max(1, @abilities.wis.mod)",
          types: ["healing"],
        }),
      },
    };
  }

}
