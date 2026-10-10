import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Hunt Domain. Marking is a bonus action that applies a tracking effect; the
 * extra damage against the marked creature is rolled from its own activity, or
 * added to the cleric's weapon hits by AC5e from the mark.
 */
export default class MarkPrey extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Mark Prey",
      activationType: "bonus",
      targetType: "creature",
      targetCount: 1,
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
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
              customFormula: "@scale.hunt.mark-prey-damage",
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

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Marked as Prey",
        statuses: ["Marked"],
        activityMatch: "Mark Prey",
        options: {
          durationSeconds: 3600,
        },
        ac5eChanges: [
          // the marked target grants its marker the extra damage; "@" resolves against the attacker
          DDBEnricherData.ChangeHelper.ac5eChange(
            "bonus=@scale.hunt.mark-prey-damage; effectOriginTokenId === tokenId && (actionType.mwak || actionType.rwak)",
            20,
            "flags.automated-conditions-5e.grants.damage.bonus",
          ),
        ],
      },
    ];
  }

}
