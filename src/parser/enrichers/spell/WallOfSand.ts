import DDBEnricherData from "../data/DDBEnricherData";

export default class WallOfSand extends DDBEnricherData {

  get type() {
    return "save";
  }

  get activity() {
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
