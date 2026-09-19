import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Oathbow: swearing an enemy marks it; attacks against it have advantage and deal an extra 3d6 piercing.
 */
export default class Oathbow extends DDBEnricherData {
  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Swear Oath",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          generateUtility: true,
          activationOverride: { type: "special", value: null, condition: "When you make a ranged attack with this weapon, choose the target as your sworn enemy" },
          targetOverride: {
            affects: { count: "1", type: "creature", choice: false, special: "" },
          },
        },
        overrides: {
          rangeType: "ft",
          rangeValue: 120,
          noTemplate: true,
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Sworn Enemy",
        activityMatch: "Swear Oath",
        statuses: ["Marked"],
        options: {
          transfer: false,
          description: "The marked creature is your sworn enemy until it dies or the next dawn seven days later.",
        },
      },
    ];
  }

}
