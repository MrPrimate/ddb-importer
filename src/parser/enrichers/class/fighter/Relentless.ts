import DDBEnricherData from "../../data/DDBEnricherData";

export default class Relentless extends DDBEnricherData {

  get type() {
    if (this.is2014) return null;
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity() {
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
