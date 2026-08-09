import DDBEnricherData from "../../data/DDBEnricherData";

export default class ExpertDivination extends DDBEnricherData {
  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Regain Spell Slot",
      targetType: "self",
      noConsumeTargets: true,
      addConsumptionScalingMax: "5",
      additionalConsumptionTargets: [
        {
          type: "spellSlots",
          value: "-1",
          target: "1",
          scaling: {
            mode: "level",
            formula: "",
          },
        },
      ],
    };
  }
}
