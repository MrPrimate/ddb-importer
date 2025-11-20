/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class FrigidExplorer extends DDBEnricherData {

  get type() {
    return "damage";
  }

  get activity() {
    return {
      targetType: "creature",
      activationType: "special",
      activationCondition: "Once per turn",
      data: {
        range: {
          units: "spec",
        },
      },
    };
  }

}
