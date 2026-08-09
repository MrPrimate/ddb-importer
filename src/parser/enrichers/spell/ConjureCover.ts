import DDBEnricherData from "../data/DDBEnricherData";

export default class ConjureCover extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
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


  override get override(): IDDBOverrideData {
    return {
      noTemplate: true,
    };
  }

}
