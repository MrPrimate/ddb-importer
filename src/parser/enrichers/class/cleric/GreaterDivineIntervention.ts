import DDBEnricherData from "../../data/DDBEnricherData";

export default class GreaterDivineIntervention extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
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

  override get effects(): IDDBEffectHint[] {
    return [];
  }

}
