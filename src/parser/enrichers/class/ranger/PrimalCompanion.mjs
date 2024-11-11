/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../../mixins/DDBEnricherMixin.mjs";

export default class PrimalCompanion extends DDBEnricherMixin {

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
