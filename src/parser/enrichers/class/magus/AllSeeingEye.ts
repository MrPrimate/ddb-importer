import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Magus level 10. Once per Long Rest a Bonus Action spends an Esoteric Eye use for 10 minutes of
 * 60 foot Truesight, during which Esoteric Eye costs no uses.
 */
export default class AllSeeingEye extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Gain Truesight",
      activationType: "bonus",
      targetType: "self",
      rangeSelf: true,
      addItemConsume: true,
      additionalConsumptionTargets: [
        {
          type: "itemUses",
          target: "Esoteric Eye",
          value: "1",
          scaling: { mode: "", formula: "" },
        },
      ],
      data: {
        duration: { value: "10", units: "minute" },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "All-Seeing Eye",
        options: {
          durationSeconds: 600,
          description: "Truesight 60 feet. Esoteric Eye can be used without expending a use.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("60", 20, "system.attributes.senses.truesight"),
        ],
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      replaceActivityUses: true,
      uses: this._getUsesWithSpent({
        type: "class",
        name: "All-Seeing Eye",
        max: "1",
        period: "lr",
      }),
    };
  }

}
