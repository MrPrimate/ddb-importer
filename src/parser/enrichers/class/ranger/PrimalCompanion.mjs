/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class PrimalCompanion extends DDBEnricherData {

  get activity() {
    return {
      name: "Command",
      type: "utility",
      activationType: "bonus",
    };
  }

  get additionalActivities() {
    return [
      {
        action: { name: "Primal Companion: Summon", type: "class" },
      },
      {
        action: { name: "Primal Companion: Restore Beast", type: "class" },
      },
    ];
  }

}
