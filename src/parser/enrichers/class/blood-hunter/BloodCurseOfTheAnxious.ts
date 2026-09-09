import DDBEnricherData from "../../data/DDBEnricherData";
import _BloodCurse from "./_BloodCurse";

export default class BloodCurseOfTheAnxious extends _BloodCurse {

  override get curseName(): string {
    return "Blood Curse of the Anxious";
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: this.curseName,
      targetType: "creature",
      targetCount: 1,
      activationType: "bonus",
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        duplicate: true,
        overrides: {
          name: this.amplifiedName,
          activationCondition: _BloodCurse.AMPLIFY_CONDITION,
        },
      },
      this.amplifyCostActivity,
    ];
  }

  override get effects(): IDDBEffectHint[] {
    // "checks made against the cursed creature" is not a roll the system makes
    // against a target, so the base curse is a marker effect only
    const description = "Charisma (Intimidation) checks made against you have advantage.";

    return [
      {
        name: "Cursed: Anxious",
        activityMatch: this.curseName,
        options: {
          expiry: "sourceEnd",
          description,
        },
      },
      {
        name: "Cursed: Anxious (Amplified)",
        activityMatch: this.amplifiedName,
        options: {
          expiry: "sourceEnd",
          description: `${description} Your next Wisdom saving throw before the curse ends has disadvantage.`,
        },
        // no isSave.wis special duration exists, so this expires on any save
        daeSpecialDurations: ["isSave"],
        changes: [
          DDBEnricherData.ChangeHelper.disadvantageAbilitySaveChange("wis"),
        ],
      },
    ];
  }

}
