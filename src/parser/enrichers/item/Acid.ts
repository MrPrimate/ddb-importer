import DDBEnricherData from "../data/DDBEnricherData";

export default class Acid extends DDBEnricherData {

  get activity() {
    return {
      type: "save",
      addItemConsume: true,
      targetType: "creature",
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
