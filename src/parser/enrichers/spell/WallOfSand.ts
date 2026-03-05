import DDBEnricherData from "../data/DDBEnricherData";

export default class WallOfSand extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  get activity(): IDDBActivityData {
    return {
      name: "Place Wall",
      data: {
        target: {
          override: true,
          template: {
            type: "wall",
            size: "30",
            width: "10",
            height: "10",
            units: "ft",
          },
        },
      },
    };
  }

}
