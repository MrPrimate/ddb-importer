/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class StormSoulTundraFreezeWater extends DDBEnricherData {

  get activity() {
    return {
      data: {
        target: {
          affects: {
            type: "space",
          },
          template: {
            contiguous: false,
            type: "cube",
            size: "5",
            units: "ft",
          },
        },
      },
    };
  }

}
