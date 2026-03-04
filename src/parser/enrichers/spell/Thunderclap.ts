import DDBEnricherData from "../data/DDBEnricherData";

export default class Thunderclap extends DDBEnricherData {

  get override(): IDDBOverrideData {
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
