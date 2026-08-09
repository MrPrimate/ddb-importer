import DDBEnricherData from "../../data/DDBEnricherData";

export default class Relentless extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    if (this.is2014) return null;
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData | null {
    if (this.is2014) return null;
    return {
      activationType: "special",
      data: {
        roll: {
          prompt: false,
          visible: false,
          formula: "1d8",
          name: "Maneuver Roll",
        },
      },
    };
  }

}
