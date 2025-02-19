/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class AnimalMessenger extends DDBEnricherData {

  get type() {
    return this.is2014 ? "utility" : "save";
  }

  get activity() {
    return {
      data: {
        save: {
          ability: ["cha"],
          dc: {
            calculation: "spellcasting",
            formula: "",
          },
        },
      },
    };
  }

}
