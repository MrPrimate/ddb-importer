/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../mixins/DDBEnricherMixin.mjs";

export default class TidalWave extends DDBEnricherMixin {

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
