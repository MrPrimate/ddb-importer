import DDBEnricherData from "../../data/DDBEnricherData";
import _BloodCurse from "./_BloodCurse";

export default class BloodCurseOfTheMuddledMind extends _BloodCurse {

  get curseName(): string {
    return "Blood Curse of the Muddled Mind";
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
      activationCondition: "The creature is concentrating on a spell or using a feature that requires concentration",
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        duplicate: true,
        overrides: {
          name: this.amplifiedName,
          activationCondition: `The creature is concentrating on a spell or using a feature that requires concentration. ${_BloodCurse.AMPLIFY_CONDITION}.`,
        },
      },
      this.amplifyCostActivity,
    ];
  }

  get effects(): IDDBEffectHint[] {
    const changes = [
      DDBEnricherData.ChangeHelper.addChange(`${CONFIG.Dice.D20Roll.ADV_MODE.DISADVANTAGE}`, 20, "system.abilities.con.save.roll.mode"),
    ];

    return [
      {
        // the next concentration save only
        name: "Muddled Mind",
        activityMatch: this.curseName,
        options: {
          durationSeconds: 6,
          durationRounds: 1,
          description: "You have disadvantage on the next Constitution saving throw you make to maintain concentration.",
        },
        daeSpecialDurations: ["turnEndSource", "isSave"],
        changes,
      },
      {
        // amplified: every concentration save until the end of the caster's next turn
        name: "Muddled Mind (Amplified)",
        activityMatch: this.amplifiedName,
        options: {
          durationSeconds: 6,
          durationRounds: 1,
          description: "You have disadvantage on all Constitution saving throws made to maintain concentration.",
        },
        daeSpecialDurations: ["turnEndSource"],
        changes,
      },
    ];
  }

}
