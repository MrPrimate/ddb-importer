/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class HillsTumble extends DDBEnricherData {
  get type() {
    return "utility";
  }

  get activity() {
    return {
      targetType: "creature",
      activationType: "special",
    };
  }

  get effects() {
    return [
      {
        statuses: ["Prone"],
      },
    ];
  }
}
