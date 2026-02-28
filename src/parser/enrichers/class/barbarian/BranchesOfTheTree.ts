import DDBEnricherData from "../../data/DDBEnricherData";

export default class BranchesOfTheTree extends DDBEnricherData {
  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
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
