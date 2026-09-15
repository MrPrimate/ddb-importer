import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Arcana Unleashed general feat. Magical Augmentation raises Speed by five feet per level of the
 * Transmutation spell's slot until the end of the turn. The slot level is the scaling prompt (no
 * consumption target) and the applied effect reads it as `@scaling`
 */
export default class TransmutationAdept extends DDBEnricherData {

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
      name: "Magical Augmentation",
      targetType: "self",
      activationType: "special",
      activationCondition: "On your turn when you cast a Transmutation spell using a spell slot (scaling: the slot level)",
      noConsumeTargets: true,
      addConsumptionScalingMax: "9",
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Magical Augmentation",
        activityMatch: "Magical Augmentation",
        changes: [
          DDBEnricherData.ChangeHelper.movementBonusChange("5 * @scaling", 20),
        ],
        options: {
          durationSeconds: null,
          expiry: "turnEnd",
          description: "Speed increased by 5 feet per level of the spell slot expended until the end of the turn.",
        },
      },
    ];
  }

}
