import DDBEnricherData from "../../data/DDBEnricherData";

export default class PersistentRage extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      targetType: "self",
      activationType: "special",
      data: {
        "range.units": "self",
      },
    };
  }

  get override() {
    return {
      uses: this._getUsesWithSpent({
        type: "class",
        name: "Rage: Regain Expended Uses",
        max: "1",
        period: "lr",
      }),
      data: {
        "flags.ddbimporter": {
          retainOriginalConsumption: true,
          consumptionValue: "-@scale.barbarian.rages",
          retainChildUses: true,
        },
      },
    };
  }

}
