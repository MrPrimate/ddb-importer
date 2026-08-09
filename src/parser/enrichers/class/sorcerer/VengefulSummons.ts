import DDBEnricherData from "../../data/DDBEnricherData";

export default class VengefulSummons extends DDBEnricherData {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Vengeful Summons",
      activationType: "action",
      addItemConsume: true,
      itemConsumeTargetName: "Sorcery Points",
      itemConsumeValue: "5",
      data: {
        range: {
          units: "ft",
          value: "60",
        },
        duration: {
          value: "10",
          units: "minute",
        },
      },
    };
  }

}
