import DDBEnricherData from "../../data/DDBEnricherData";

export default class BattleHymn extends DDBEnricherData {

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    if (!this.isAction) return [];
    return [
      {
        name: "Battle Hymn",
        options: {
          durationRounds: 1,
          description: "While within 30 feet of the singing bard and able to hear them, add 1d4 to ability checks and saving throws. Lasts until the start of the bard's next turn.",
        },
        daeSpecialDurations: ["turnStartSource"],
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1d4", 20, "system.rolls.ability.check.bonus"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("1d4", 20, "system.rolls.ability.save.bonus"),
        ],
      },
    ];
  }

}
