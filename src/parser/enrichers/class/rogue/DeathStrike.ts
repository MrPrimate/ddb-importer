import DDBEnricherData from "../../data/DDBEnricherData";

export default class DeathStrike extends DDBEnricherData {

  get type() {
    return "save";
  }

  get activity() {
    return {
      targetType: "creature",
      activationType: "special",
      activationCondition: "Hit with Sneak Attack in first round",
      data: {
        save: {
          ability: ["con"],
          dc: {
            calculation: "dex",
            formula: "",
          },
        },
      },
    };
  }

}
