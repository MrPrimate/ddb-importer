/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../mixins/DDBEnricherData.mjs";

export default class Thunderclap extends DDBEnricherData {

  get overrides() {
    return {
      data: {
        "system.range": {
          units: "spec",
        },
        "system.target": {
          template: {
            size: "15",
            type: "cube",
          },
        },
      },
    };
  }

}
