import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Arrow-Catching Shield: +2 AC against ranged attacks, and a reaction to become the target of a ranged attack aimed at a creature within 5 feet. The bonus only applies to ranged attacks, so it rides on the reaction rather than a transfer effect.
 */
export default class ArrowCatchingShield extends DDBEnricherData {
  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Intercept Attack",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          generateUtility: true,
          activationOverride: { type: "reaction", value: null, condition: "When an attacker makes a ranged attack roll against a target within 5 feet of you" },
          targetOverride: {
            affects: { count: "1", type: "creature", choice: false, special: "" },
          },
        },
        overrides: {
          rangeType: "ft",
          rangeValue: 5,
          noTemplate: true,
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Arrow-Catching: +2 AC vs Ranged",
        activityMatch: "Intercept Attack",
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("2", 20, "system.attributes.ac.bonus"),
        ],
        options: {
          description: "+2 AC against ranged attacks until the start of your next turn.",
        },
        data: {
          duration: {
            value: 6,
            expiry: "turnStart",
            expired: null,
          },
        },
      },
    ];
  }

}
