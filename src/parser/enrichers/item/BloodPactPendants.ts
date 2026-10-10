import DDBEnricherData from "../data/DDBEnricherData";

/**
 * "When a bound creature dies, it's immediately revived with 2d10 Hit Points plus twice the number
 * of Hit Points it had sacrificed. When a creature is revived in this way, the other bound creature
 * immediately drops to 0 Hit Points and has the Unconscious condition." The parsed heal carried the
 * Unconscious, which belongs to the other wearer, so the pendant's owner revives with one activity
 * and knocks out its partner with another.
 */
export default class BloodPactPendants extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Revive",
      targetType: "self",
      activationType: "special",
      activationCondition: "You die while the blood pact holds. Add twice the Hit Points you sacrificed to the roll.",
      noTemplate: true,
      data: {
        healing: DDBEnricherData.basicDamagePart({ number: 2, denomination: 10, type: "healing", scalingMode: "none" }),
        range: { units: "self" },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: "Pact Broken", type: DDBEnricherData.ACTIVITY_TYPES.UTILITY },
        build: {
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
        },
        overrides: {
          targetType: "creature",
          activationType: "special",
          activationCondition: "Immediately after you are revived by the pact: the other bound creature drops to 0 Hit Points, even through effects that would prevent it.",
          noConsumeTargets: true,
          noTemplate: true,
          data: { range: { units: "spec", special: "The other bound creature, on the same plane" } },
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
        name: "Blood Pact: Unconscious",
        activityMatch: "Pact Broken",
        statuses: ["Unconscious"],
        options: { transfer: false, description: "Drops to 0 Hit Points and has the Unconscious condition." },
      },
    ];
  }

}
