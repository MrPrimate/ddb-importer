import DDBEnricherData from "../../data/DDBEnricherData";

export default class RegainBardicInspiration extends DDBEnricherData {
  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      addItemConsume: true,
      itemConsumeValue: "-1",
      activationType: "special",
      addConsumptionScalingMax: "9",
      additionalConsumptionTargets: [
        {
          type: "spellSlots",
          value: "1",
          target: "1",
          scaling: {
            mode: "level",
          },
        },
      ],
      data: {
        name: "Regain via Spell Slot",
      },
    };
  }
}
