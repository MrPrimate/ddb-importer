import DDBEnricherData from "../data/DDBEnricherData";

export default class ConjureCover extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      name: "Place Segments",
      data: {
        target: {
          override: true,
          template: {
            count: "3",
            contiguous: true,
            type: "wall",
            size: "5",
            width: "1.5",
            height: "3",
            units: "ft",
          },
        },
      },
    };
  }


  get override(): IDDBOverrideData {
    return {
      noTemplate: true,
    };
  }

}
