import DDBEnricherData from "../data/DDBEnricherData";

export default class TidalWave extends DDBEnricherData {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get override(): IDDBOverrideData {
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
