import DDBEnricherData from "../../data/DDBEnricherData";

export default class StormSoulTundraFreezeWater extends DDBEnricherData {

  get activity(): IDDBActivityData {
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
