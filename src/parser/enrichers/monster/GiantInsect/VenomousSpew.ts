import DDBEnricherData from "../../data/DDBEnricherData";

export default class VenomousSpew extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
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
