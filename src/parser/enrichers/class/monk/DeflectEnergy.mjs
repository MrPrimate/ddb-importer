/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class DeflectEnergy extends DDBEnricherData {
  get type() {
    return "none";
  }

  get additionalActivities() {
    return [
      { action: { name: "Deflect Attack", type: "class" } },
      {
        action: { name: "Deflect Attack: Redirect Attack", type: "class" },
        override: { data: {
          "damage.types": DDBEnricherData.allDamageTypes(),
        } },
      },
    ];
  }

  get override() {
    return {
      data: {
        "flags.ddbimporter": {
          ignoredConsumptionActivities: ["Reduce Damage"],
        },
      },
    };
  }
}
