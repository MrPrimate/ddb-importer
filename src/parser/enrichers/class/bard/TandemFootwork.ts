import DDBEnricherData from "../../data/DDBEnricherData";

export default class TandemFootwork extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
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
