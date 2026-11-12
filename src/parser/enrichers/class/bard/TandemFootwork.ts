import DDBEnricherData from "../../data/DDBEnricherData";

export default class TandemFootwork extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      activationType: "special",
      data: {
        roll: {
          prompt: false,
          visible: false,
          formula: `@scale.${this.classIdentifier("Bard")}.inspiration`,
          name: "Initiative bonus",
        },
      },
    };
  }

}
