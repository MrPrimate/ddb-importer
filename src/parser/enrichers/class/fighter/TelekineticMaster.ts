import DDBEnricherData from "../../data/DDBEnricherData";

export default class TelekineticMaster extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity() {
    return {
      name: "Spend Energy Die to Regain Use",
      addItemConsume: true,
      activationType: "",
      additionalConsumptionTargets: [
        {
          type: "itemUses",
          target: "",
          value: "-1",
          scaling: {
            mode: "",
            formula: "",
          },
        },
      ],
    };
  }

  get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({
        type: "class",
        name: "Telekinetic Master: Weapon Attack",
        max: "1",
        period: "lr",
      }),
      retainChildUses: true,
    };
  }

}
