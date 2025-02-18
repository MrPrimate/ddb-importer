/* eslint-disable class-methods-use-this */
// import { utils } from "../../../../lib/_module.mjs";
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class Bite extends DDBEnricherData {
  get type() {
    return this.is2014 ? "attack" : "save";
  }

  get activity() {
    return {
      targetType: "creature",
      activationType: "special",
      activationCondition: "Start of each of your turn",
      noTemplate: true,
      data: {
        range: {
          units: "ft",
          value: "5",
        },
        save: {
          ability: ["dex"],
          dc: {
            calculation: "spellcasting",
            formula: "",
          },
        },
      },
    };
  }

}
