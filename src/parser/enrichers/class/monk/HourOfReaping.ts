import DDBEnricherData from "../../data/DDBEnricherData";

export default class HourOfReaping extends DDBEnricherData {

  get type() {
    return "save";
  }

  get activity() {
    return {
      data: {
        save: {
          ability: ["wis"],
          dc: { calculation: "wis", formula: "" },
        },
      },
    };
  }

}
