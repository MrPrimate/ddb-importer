import DDBEnricherData from "../../data/DDBEnricherData";

export default class MaskOfTheWild extends DDBEnricherData {

  get type() {
    return "check";
  }

  get activity() {
    return {
      data: {
        check: {
          associated: ["ste"],
          ability: "",
          dc: {
            calculation: "",
            formula: "",
          },
        },
      },
    };
  }

}
