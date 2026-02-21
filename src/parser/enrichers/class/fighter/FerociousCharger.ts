import DDBEnricherData from "../../data/DDBEnricherData";

export default class FerociousCharger extends DDBEnricherData {

  get type() {
    return "save";
  }

  get activity() {
    return {
      name: "vs Prone",
      data: {
        save: {
          ability: ["str"],
          dc: {
            calculation: "str",
            formula: "",
          },
        },
      },
    };
  }

}
