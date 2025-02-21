/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class VenomousSpew extends DDBEnricherData {

  get type() {
    return "save";
  }

  get activity() {
    return {
      targetType: "creature",
      data: {
        range: {
          units: "ft",
          value: "10",
        },
        save: {
          ability: ["con"],
          dc: {
            calculation: "spellcasting",
            formula: "",
          },
        },
      },
    };
  }

}
