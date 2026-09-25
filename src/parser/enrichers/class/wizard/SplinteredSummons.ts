import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Conjurer (AU 2024) level 14: a Conjuration spirit spell summons two creatures with halved hit
 * points, once per long rest, with the use bought back by a level 5+ slot. The halving is an
 * applied effect for the summoned creatures; splitting the summon itself stays manual.
 */
export default class SplinteredSummons extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get useDefaultAdditionalActivities(): boolean {
    return false;
  }

  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Splintered Summons",
      targetType: "creature",
      targetCount: "2",
      activationType: "special",
      activationCondition: "When you use a spell slot to cast a Conjuration spell that summons a spirit: apply to both summoned creatures",
      addItemConsume: true,
      noTemplate: true,
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Restore Use with Level 5+ Slot",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateActivation: true,
          generateConsumption: true,
          generateTarget: true,
          activationOverride: { type: "none", value: null, condition: "" },
        },
        overrides: {
          targetType: "self",
          addItemConsume: true,
          itemConsumeValue: "-1",
          addConsumptionScalingMax: "9",
          additionalConsumptionTargets: [
            { type: "spellSlots", value: "1", target: "5", scaling: { mode: "level", formula: "" } },
          ],
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Splintered Summon",
        activityMatch: "Splintered Summons",
        changes: [
          DDBEnricherData.ChangeHelper.multiplyChange("0.5", 20, "system.attributes.hp.max"),
        ],
        options: {
          description: "Hit Point maximum and current Hit Points halved; both creatures vanish if concentration ends.",
        },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({
        type: "class",
        name: "Splintered Summons",
        max: "1",
        period: "lr",
      }),
    };
  }

}
