import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Vestige Patron (AU 2024). A companion feature (companions.ts): the primary activity is the
 * summon, whose profile is the actor parsed from the chosen option's stat block. The option child
 * keeps the feature name (KEEP_CHOICE_FEATURE_NAME) so it parses that block itself and its summon
 * folds into this document via mergeChoiceActivities; DDB's per-form actions ride along and the
 * bonus-action command sits beside them.
 */
export default class VestigeCompanion extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SUMMON;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Summon Vestige",
      activationType: "action",
      targetType: "self",
      noConsumeTargets: true,
      noTemplate: true,
      data: {
        creatureSizes: ["sm"],
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Command Vestige",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        overrides: {
          activationType: "bonus",
          noConsumeTargets: true,
        },
      },
    ];
  }

  /**
   * A loaded enricher drops DDB's action matching unless it opts back in; the vestige's strike,
   * HP tracker and Divine Power option hang off the chosen option and vary by type, so match
   * them rather than list them.
   */
  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get addToDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get mergeChoiceActivities(): boolean {
    return true;
  }

}
