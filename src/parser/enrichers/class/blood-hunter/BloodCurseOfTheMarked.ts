import DDBEnricherData from "../../data/DDBEnricherData";
import _BloodCurse from "./_BloodCurse";

export default class BloodCurseOfTheMarked extends _BloodCurse {

  override get curseName(): string {
    return "Blood Curse of the Marked";
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: this.curseName,
      useActivitySnippet: true,
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
    const description = "When the blood hunter hits you with a weapon carrying an active crimson rite, they roll an additional hemocraft die for the rite damage.";

    return [
      {
        // "Until the end of your turn" - the turn the mark is placed on
        name: "Marked",
        activityMatch: this.curseName,
        options: {
          expiry: "turnEnd",
          description,
        },
      },
      {
        name: "Marked (Amplified)",
        activityMatch: this.amplifiedName,
        options: {
          expiry: "turnEnd",
          description: `${description} Their next attack roll against you before the end of their turn has advantage.`,
        },
        daeSpecialDurations: ["1Attack"],
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange("1", 20, "flags.midi-qol.grants.advantage.attack.all"),
        ],
      },
    ];
  }

}
