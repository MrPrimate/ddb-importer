import DDBEnricherData from "../../data/DDBEnricherData";

export default class BattleSagas extends DDBEnricherData {

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  /** The 1 minute recitation is once per short or long rest; the action's parsed Bardic Inspiration cost belongs to the later reaction. */
  override get activity(): IDDBActivityData | null {
    if (!this.isAction) return null;
    return { addItemConsume: true };
  }

  override get effects(): IDDBEffectHint[] {
    if (!this.isAction) return [];
    return [
      {
        name: "Battle Sagas",
        options: {
          durationSeconds: 3600,
          description: "Resistance to Poison damage and Immunity to the Frightened and Poisoned conditions for 1 hour. Hit Point maximum increases by 2d10 (apply manually), and once per turn the creature can add 1d4 to an attack roll or saving throw.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.damageResistanceChange("poison"),
          DDBEnricherData.ChangeHelper.conditionImmunityChange("frightened"),
          DDBEnricherData.ChangeHelper.conditionImmunityChange("poisoned"),
        ],
      },
    ];
  }

}
