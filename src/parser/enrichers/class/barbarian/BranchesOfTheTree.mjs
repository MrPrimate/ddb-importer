/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class BranchesOfTheTree extends DDBEnricherData {
  get type() {
    return "save";
  }

  get activity() {
    return {
      activationType: "reaction",
      data: {
        save: {
          ability: ["str"],
          dc: {
            calculation: "str",
            formula: "",
          },
        },
        target: {
          affects: {
            type: "creature",
            value: "1",
          },
        },
        range: {
          value: "30",
          units: "ft",
        },
      },
    };
  }
}
