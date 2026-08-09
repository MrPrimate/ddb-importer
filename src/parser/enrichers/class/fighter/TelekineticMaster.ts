import DDBEnricherData from "../../data/DDBEnricherData";

export default class TelekineticMaster extends DDBEnricherData {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Spend Energy Die to Regain Use",
      addItemConsume: true,
      activationType: "special",
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

  override get override(): IDDBOverrideData {
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
