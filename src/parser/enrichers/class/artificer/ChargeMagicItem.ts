import DDBEnricherData from "../../data/DDBEnricherData";

export default class ChargeMagicItem extends DDBEnricherData {

  get activity() {
    return {
      noConsumeTargets: true,
      addSpellSlotConsume: true,
      addSpellSlotScalingMode: "level",
      addSpellSlotScalingFormula: "1",
      spellSlotConsumeTarget: "1",
      addConsumptionScalingMax: "",
      data: {
        roll: {
          name: "Charges Gained",
          formula: `(@scaling)`,
        },
      },
    };
  }
}
