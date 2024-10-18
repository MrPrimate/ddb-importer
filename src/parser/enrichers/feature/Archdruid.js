/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../DDBEnricherMixin.js";

export default class Archdruid extends DDBEnricherMixin {

  activity() {
    return {
      type: "utility",
      name: "Regain A Wild Shape Use",
      activationType: "special",
      condition: "When you roll initiative and have no Wild Shape uses remaining",
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

  additionalActivities() {
    return [
      { action: { name: "Nature Magician", type: "class" } },
    ];
  }

}
