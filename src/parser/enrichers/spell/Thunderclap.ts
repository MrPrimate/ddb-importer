import DDBEnricherData from "../data/DDBEnricherData";

export default class Thunderclap extends DDBEnricherData {

  get override(): IDDBOverrideData {
    return {
      data: {
        system: {
          range: {
            units: this.is2014 ? "spec" : "self",
          },
          target: {
            template: {
              size: this.is2014 ? "15" : "5",
              type: this.is2014 ? "cube" : "radius",
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
