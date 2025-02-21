/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class Maze extends DDBEnricherData {

  get activity() {
    return {
      name: "Cast",
    };
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Check",
          type: "check",
        },
        build: {
          generateCheck: true,
        },
        overrides: {
          data: {
            check: {
              ability: ["int"],
              dc: {
                formula: "20",
                calculation: "",
              },
            },
          },
        },
      },
    ];
  }

}
