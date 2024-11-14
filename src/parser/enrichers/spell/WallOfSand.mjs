/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../mixins/DDBEnricherMixin.mjs";

export default class WallOfSand extends DDBEnricherMixin {

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
