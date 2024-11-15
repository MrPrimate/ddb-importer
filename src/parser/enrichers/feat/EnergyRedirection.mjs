/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class EnergyRedirection extends DDBEnricherData {

  get activity() {
    return {
      name: "Energy Redirection",
      type: "save",
      data: {
        save: {
          ability: "dex",
          dc: {
            calculation: "con",
            formula: "",
          },
        },
        damage: {
          parts: [DDBEnricherData.basicDamagePart({ number: 2, denomination: 8, bonus: "@abilities.con.mod", types: DDBEnricherData.allDamageTypes() })],
        },
      },
    };
  }

}
