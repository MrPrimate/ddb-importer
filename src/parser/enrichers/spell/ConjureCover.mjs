/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class ConjureCover extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get activity() {
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


  get override() {
    return {
      noTemplate: true,
    };
  }

}
