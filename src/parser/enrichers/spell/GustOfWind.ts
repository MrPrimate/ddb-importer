import DDBEnricherData from "../data/DDBEnricherData";

export default class GustOfWind extends DDBEnricherData {

  get activity(): IDDBActivityData {
    return {
      data: {
        target: {
          override: true,
          template: {
            count: "",
            contiguous: false,
            type: "line",
            size: "60",
            width: "10",
            height: "",
            units: "ft",
          },
          affects: {
            count: "",
            type: "creature",
            choice: false,
            special: "",
          },
        },
      },
    };
  }

}
