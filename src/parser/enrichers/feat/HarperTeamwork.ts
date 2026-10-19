import DDBEnricherData from "../data/DDBEnricherData";

export default class HarperTeamwork extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Withering Wordplay",
      activationType: "special",
      activationCondition: "When you take the Help action to assist an ally's attack roll against an enemy",
      targetType: "enemy",
      targetCount: "1",
    };
  }

  // only the enemy's first saving throw before the start of your next turn
  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Withering Wordplay",
        activityMatch: "Withering Wordplay",
        daeSpecialDurations: ["isSave"],
        options: { expiry: "sourceStart" },
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.disadvantage.ability.save.all"),
        ],
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange("1", 20, "flags.automated-conditions-5e.save.disadvantage"),
        ],
      },
    ];
  }

}
