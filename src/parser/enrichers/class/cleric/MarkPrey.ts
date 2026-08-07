import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Hunt Domain. Marking is a bonus action that applies a tracking effect; the
 * extra damage against the marked creature is rolled from its own activity.
 */
export default class MarkPrey extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      name: "Mark Prey",
      activationType: "bonus",
      targetType: "creature",
      targetCount: 1,
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Extra Damage",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateDamage: true,
          generateTarget: true,
          generateRange: true,
          generateActivation: true,
          noeffect: true,
          allowCritical: true,
          activationOverride: {
            type: "special",
            value: null,
            condition: "You hit the marked creature",
          },
          damageParts: [
            DDBEnricherData.basicDamagePart({
              number: 1,
              denomination: 6,
              types: ["bludgeoning", "piercing", "slashing"],
            }),
          ],
        },
        overrides: {
          noConsumeTargets: true,
          targetType: "creature",
        },
      },
    ];
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Marked as Prey",
        activityMatch: "Mark Prey",
        options: {
          durationSeconds: 3600,
        },
      },
    ];
  }

}
