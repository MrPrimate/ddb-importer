/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class Archdruid extends DDBEnricherData {

  get activity() {
    return {
      type: "utility",
      name: "Regain A Wild Shape Use",
      activationType: "encounter",
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
