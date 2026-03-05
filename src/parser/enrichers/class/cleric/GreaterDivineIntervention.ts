import DDBEnricherData from "../../data/DDBEnricherData";

export default class GreaterDivineIntervention extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      data: {
        roll: {
          prompt: false,
          visible: false,
          formula: "2d4",
          name: "Long rests till next intervention",
        },
      },
    };
  }

  get effects(): IDDBEffectHint[] {
    return [];
  }

}
