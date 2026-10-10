import DDBEnricherData from "../data/DDBEnricherData";

/** Touch of Flame: for a minute, melee weapon hits deal extra fire damage equal to your proficiency bonus. */
export default class SurtrsTouch extends DDBEnricherData {

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Touch of Flame",
        activityMatch: "Touch of Flame",
        options: { durationSeconds: 60, description: "Melee weapon hits deal extra Fire damage equal to your proficiency bonus." },
        changes: [DDBEnricherData.ChangeHelper.unsignedAddChange("+@prof[fire]", 20, "system.bonuses.mwak.damage")],
      },
    ];
  }

}
