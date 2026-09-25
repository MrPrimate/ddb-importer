import DDBEnricherData from "../../data/DDBEnricherData";

export default class DistantTransposition extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Restore Use with Level 3+ Slot",
      targetType: "self",
      activationType: "none",
      addItemConsume: true,
      itemConsumeTargetName: "Benign Transposition",
      itemConsumeValue: "-1",
      addConsumptionScalingMax: "9",
      additionalConsumptionTargets: [
        { type: "spellSlots", value: "1", target: "3", scaling: { mode: "level", formula: "" } },
      ],
    };
  }

}
