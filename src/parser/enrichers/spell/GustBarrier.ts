import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Parses as the melee attacker's Constitution save; the ranged attack ward the caster gets on
 * casting is added as its own activity.
 */
export default class GustBarrier extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      name: "Melee Attacker Save",
      targetType: "creature",
      targetCount: 1,
      activationType: "special",
      activationCondition: "A melee attacker hits you while Gust Barrier lasts",
      // spell activities inherit the spell's action casting time and self target unless they own them
      overrideActivation: true,
      overrideTarget: true,
      data: {
        // instantaneous so dnd5e does not stamp the spell's round onto the applied Prone
        duration: { override: true, value: "", units: "inst", concentration: false },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Cast",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
        },
        overrides: {
          targetType: "self",
          rangeSelf: true,
        },
      },
    ];
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Gust Barrier: Prone",
        activityMatch: "Melee Attacker Save",
        statuses: ["Prone"],
        // prone lasts until the attacker stands
        options: { expiry: null, durationSeconds: null },
      },
      {
        name: "Gust Barrier",
        activityMatch: "Cast",
        // "Until the end of your next turn, any ranged attack against you is made with disadvantage"
        options: { expiry: "sourceEnd" },
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange(
            "actionType.rwak || actionType.rsak",
            20,
            "flags.automated-conditions-5e.grants.attack.disadvantage",
          ),
        ],
      },
    ];
  }

}
