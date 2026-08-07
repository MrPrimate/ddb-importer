import DDBEnricherData from "../../data/DDBEnricherData";
import _BloodCurse from "./_BloodCurse";

export default class BloodCurseOfTheFallenPuppet extends _BloodCurse {

  get curseName(): string {
    return "Blood Curse of the Fallen Puppet";
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
      activationCondition: "A creature you can see within 30 feet of you drops to 0 hit points",
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        duplicate: true,
        overrides: {
          name: this.amplifiedName,
          activationCondition: `A creature you can see within 30 feet of you drops to 0 hit points. ${_BloodCurse.AMPLIFY_CONDITION}.`,
        },
      },
      this.amplifyCostActivity,
    ];
  }

  get effects(): IDDBEffectHint[] {
    // the attack is made by the cursed creature; the amplified bonus uses the
    // blood hunter's hemocraft modifier, which cannot resolve on the target's
    // actor, so both are marker effects the GM applies
    return [
      {
        name: "Fallen Puppet",
        activityMatch: this.curseName,
        options: {
          durationSeconds: 6,
          durationRounds: 1,
          description: "You immediately make one weapon attack against a target of the blood hunter's choice within your range.",
        },
        daeSpecialDurations: ["1Attack"],
      },
      {
        name: "Fallen Puppet (Amplified)",
        activityMatch: this.amplifiedName,
        options: {
          durationSeconds: 6,
          durationRounds: 1,
          description: "You can first move up to half your speed, then immediately make one weapon attack against a target of the blood hunter's choice within your range, with a bonus to the attack roll equal to their Hemocraft modifier (minimum of +1).",
        },
        daeSpecialDurations: ["1Attack"],
      },
    ];
  }

}
