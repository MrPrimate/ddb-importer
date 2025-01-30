/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class PackDamage extends DDBEnricherData {
  get type() {
    return "save";
  }

  get activity() {
    return {
      targetType: "creature",
      activationType: "special",
      activationCondition:
        "Moves within 10 feet of a creature you can see and whenever a creature you can see enters a space within 10 feet of the pack or ends its turn there",
      data: {
        range: {
          units: "ft",
          value: "10",
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
