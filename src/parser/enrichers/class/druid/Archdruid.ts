import DDBEnricherData from "../../data/DDBEnricherData";

export default class Archdruid extends DDBEnricherData {

  // The 2014 Archdruid is passive (unlimited Wild Shape, ignore spell components); both
  // activities below describe the 2024 feature.
  override get activity(): IDDBActivityData {
    if (this.is2014) {
      return {
        type: DDBEnricherData.ACTIVITY_TYPES.NONE,
      };
    }
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

  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (this.is2014) return [];
    return [
      { action: { name: "Nature Magician", type: "class" } },
    ];
  }

}
