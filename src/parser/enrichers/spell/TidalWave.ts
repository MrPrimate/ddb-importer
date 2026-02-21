import DDBEnricherData from "../data/DDBEnricherData";

export default class TidalWave extends DDBEnricherData {

  get type() {
    return "save";
  }

  get override() {
    return {
      data: {
        "system.target": {
          template: {
            contiguous: false,
            type: "line",
            size: "30",
            width: "10",
            units: "ft",
          },
        },
      },
    };
  }

}
