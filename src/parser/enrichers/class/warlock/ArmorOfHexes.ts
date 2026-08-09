import DDBEnricherData from "../../data/DDBEnricherData";

export default class ArmorOfHexes extends DDBEnricherData {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      activationType: "reaction",
      targetType: "self",
      data: {
        roll: {
          prompt: false,
          visible: false,
          formula: "1d6",
          name: "Roll",
        },
      },
    };
  }

}
