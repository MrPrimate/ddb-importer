import DDBEnricherData from "../../data/DDBEnricherData";
import _BloodCurse from "./_BloodCurse";

export default class BloodCurseOfTheAnxious extends _BloodCurse {

  get curseName(): string {
    return "Blood Curse of the Anxious";
  }

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      name: this.curseName,
      targetType: "creature",
      targetCount: 1,
      activationType: "bonus",
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
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

  get effects(): IDDBEffectHint[] {
    // "checks made against the cursed creature" is not a roll the system makes
    // against a target, so the base curse is a marker effect only
    const description = "Charisma (Intimidation) checks made against you have advantage.";

    return [
      {
        name: "Cursed: Anxious",
        activityMatch: this.curseName,
        options: {
          durationSeconds: 6,
          durationRounds: 1,
          description,
        },
        daeSpecialDurations: ["turnEndSource"],
      },
      {
        name: "Cursed: Anxious (Amplified)",
        activityMatch: this.amplifiedName,
        options: {
          durationSeconds: 6,
          durationRounds: 1,
          description: `${description} Your next Wisdom saving throw before the curse ends has disadvantage.`,
        },
        // no isSave.wis special duration exists, so this expires on any save
        daeSpecialDurations: ["turnEndSource", "isSave"],
        changes: [
          DDBEnricherData.ChangeHelper.addChange(`${CONFIG.Dice.D20Roll.ADV_MODE.DISADVANTAGE}`, 20, "system.abilities.wis.save.roll.mode"),
        ],
      },
    ];
  }

}
