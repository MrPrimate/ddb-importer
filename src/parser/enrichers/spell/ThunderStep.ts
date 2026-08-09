import DDBEnricherData from "../data/DDBEnricherData";

export default class ThunderStep extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      data: {
        range: {
          override: true,
          value: "",
          units: "self",
        },
        target: {
          override: true,
          affects: {
            type: "creature",
          },
          template: {
            contiguous: false,
            type: "radius",
            size: "10",
            units: "ft",
          },
        },
      },
    };


  }

}
