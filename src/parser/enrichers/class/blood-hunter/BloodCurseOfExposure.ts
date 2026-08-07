import DDBEnricherData from "../../data/DDBEnricherData";
import _BloodCurse from "./_BloodCurse";

export default class BloodCurseOfExposure extends _BloodCurse {

  get curseName(): string {
    return "Blood Curse of Exposure";
  }

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      name: this.curseName,
      targetType: "creature",
      targetCount: 1,
      activationType: "reaction",
      activationCondition: "A creature you can see within 30 feet of you takes damage from an attack or spell",
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        duplicate: true,
        overrides: {
          name: this.amplifiedName,
          activationCondition: `A creature you can see within 30 feet of you takes damage from an attack or spell. ${_BloodCurse.AMPLIFY_CONDITION}.`,
        },
      },
      this.amplifyCostActivity,
    ];
  }

  get effects(): IDDBEffectHint[] {
    // the damage types stripped depend on the triggering attack or spell, so
    // these are marker effects the GM resolves
    return [
      {
        name: "Exposed",
        activityMatch: this.curseName,
        options: {
          durationSeconds: 6,
          durationRounds: 1,
          description: "You lose resistance to all the damage types dealt by the triggering attack or spell, including for that triggering effect.",
        },
        daeSpecialDurations: ["turnEnd"],
      },
      {
        name: "Exposed (Amplified)",
        activityMatch: this.amplifiedName,
        options: {
          durationSeconds: 6,
          durationRounds: 1,
          description: "You lose invulnerability to the damage types of the triggering attack or spell, but have resistance to those damage types until the end of your next turn.",
        },
        daeSpecialDurations: ["turnEnd"],
      },
    ];
  }

}
