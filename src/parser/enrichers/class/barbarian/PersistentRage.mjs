/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

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
      data: {
        "system.uses": this._getUsesWithSpent({
          type: "class",
          name: "Rage: Regain Expended Uses",
          max: "1",
          period: "lr",
        }),
        "flags.ddbimporter": {
          retainOriginalConsumption: true,
          consumptionValue: "-@scale.barbarian.rages",
          retainChildUses: true,
        },
      },
    };
  }

}
