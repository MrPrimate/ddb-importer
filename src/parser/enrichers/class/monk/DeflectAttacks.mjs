/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class DeflectAttacks extends DDBEnricherData {

  get additionalActivities() {
    return [
      { action: { name: "Deflect Attack", type: "class" } },
      { action: { name: "Deflect Attack: Redirect Attack", type: "class" } },
    ];
  }

  get override() {
    return {
      data: {
        "flags.ddbimporter": {
          ignoredConsumptionActivities: ["Reduce Damage"],
          skipScale: true,
        },
      },
    };
  }

}
