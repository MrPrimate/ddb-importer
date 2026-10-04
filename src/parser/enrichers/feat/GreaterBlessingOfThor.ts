import DDBEnricherData from "../data/DDBEnricherData";

/** Storm Strike: for a minute, melee weapon hits deal extra damage of the weapon's type equal to your proficiency bonus, once on each of your turns. */
export default class GreaterBlessingOfThor extends DDBEnricherData {

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Storm Strike",
        activityMatch: "Storm Strike",
        options: { durationSeconds: 60, description: "Melee weapon hits deal extra damage equal to your proficiency bonus, no more than once on each of your turns." },
        changes: [DDBEnricherData.ChangeHelper.unsignedAddChange("+@prof", 20, "system.rolls.damage.mwak.bonus")],
      },
    ];
  }

}
