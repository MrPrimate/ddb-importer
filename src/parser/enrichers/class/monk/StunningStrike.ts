import DDBEnricherData from "../../data/DDBEnricherData";

export default class StunningStrike extends DDBEnricherData {

  get type() {
    return "save";
  }

  get activity() {
    return {
      targetType: "creature",
      activationType: "special",
      data: {
        "range.units": "touch",
        save: {
          ability: ["con"],
          dc: {
            calculation: "wis",
            formula: "",
          },
        },
      },
    };
  }

}
