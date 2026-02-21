import DDBEnricherData from "../../data/DDBEnricherData";

export default class ExpertDivination extends DDBEnricherData {
  get type() {
    return "utility";
  }

  get activity() {
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
