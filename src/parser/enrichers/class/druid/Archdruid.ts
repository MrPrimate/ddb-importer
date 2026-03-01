import DDBEnricherData from "../../data/DDBEnricherData";

export default class Archdruid extends DDBEnricherData {

  get activity() {
    return {
      type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
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
