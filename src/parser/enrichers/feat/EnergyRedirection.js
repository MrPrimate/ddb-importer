/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../mixins/DDBEnricherMixin.mjs";

export default class EnergyRedirection extends DDBEnricherMixin {

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
          parts: [DDBEnricherMixin.basicDamagePart({ number: 2, denomination: 8, bonus: "@abilities.con.mod", types: DDBEnricherMixin.allDamageTypes() })],
        },
      },
    };
  }

}
