/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class Thunderclap extends DDBEnricherData {

  get override() {
    return {
      data: {
        system: {
          range: {
            units: "spec",
          },
          target: {
            template: {
              size: "15",
              type: "cube",
            },
          },
        },
        flags: {
          "midi-qol": {
            AoETargetType: "any",
            AoETargetTypeIncludeSelf: false,
          },
        },
      },
    };
  }

}
