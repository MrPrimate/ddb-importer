import DDBEnricherData from "../../data/DDBEnricherData";

export default class Howl extends DDBEnricherData {

  get activity(): IDDBActivityData {
    return {
      targetSelf: true,
      data: {
        target: {
          affects: {
            count: "",
            type: "enemy",
          },
          template: {
            contiguous: false,
            type: "radius",
            size: "15",
            units: "ft",
          },
          prompt: false,
        },
      },
    };
  }

}
