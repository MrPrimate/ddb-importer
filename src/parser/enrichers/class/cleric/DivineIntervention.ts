import DDBEnricherData from "../../data/DDBEnricherData";

export default class DivineIntervention extends DDBEnricherData {

  get activity() {
    if (this.is2014) {
      return {
        type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        addItemConsume: true,
        data: {
          roll: {
            prompt: false,
            visible: false,
            formula: "1d100",
            name: "Implore Aid",
          },
        },
      };
    } else {
      return {
        type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        addItemConsume: true,
      };
    }
  }

  get override() {
    return {
      uses: {
        spent: "0",
        max: "1",
        recovery: [
          { period: "lr", type: "recoverAll", formula: undefined },
        ],
      },
      retainOriginalConsumption: true,
    };
  }

}
