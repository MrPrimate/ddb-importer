import DDBEnricherData from "../data/DDBEnricherData";

export default class EnergyRedirection extends DDBEnricherData {

  get activity(): IDDBActivityData {
    return {
      name: "Energy Redirection",
      type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
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
