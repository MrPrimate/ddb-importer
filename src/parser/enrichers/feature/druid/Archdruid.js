/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../../DDBEnricherMixin.js";

export default class Archdruid extends DDBEnricherMixin {

  get activity() {
    return {
      type: "utility",
      name: "Regain A Wild Shape Use",
      activationType: "special",
      activationCondition: "When you roll initiative and have no Wild Shape uses remaining",
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

  get additionalActivities() {
    return [
      { action: { name: "Nature Magician", type: "class" } },
    ];
  }

}
