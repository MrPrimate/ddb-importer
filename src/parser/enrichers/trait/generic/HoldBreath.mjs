/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class HoldBreath extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get affect() {
    return {
      targetType: "self",
      activationType: "special",
      data: {
        duration: {
          value: "15",
          units: "minute",
        },
      },
    };
  }

  get effects() {
    return [
      {
        data: {
          "duration.rounds": 600,
        },
      },
    ];
  }

}
