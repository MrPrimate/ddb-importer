import DDBEnricherData from "../../data/DDBEnricherData";

export default class TandemFootwork extends DDBEnricherData {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      activationType: "special",
      data: {
        roll: {
          prompt: false,
          visible: false,
          formula: "@scale.bard.inspiration",
          name: "Initiative bonus",
        },
      },
    };
  }

}
