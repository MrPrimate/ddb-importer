import DDBEnricherData from "../data/DDBEnricherData";

/** Berserker Fury: while Bloodied, a bonus action adds your proficiency bonus to melee weapon damage for a minute (and 0 hit points leave you conscious, still making death saves). */
export default class BloodOfTheBerserker extends DDBEnricherData {

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Berserker Fury",
        activityMatch: "Berserker Fury",
        options: { durationSeconds: 60, description: "Melee weapon attacks deal extra damage equal to your proficiency bonus; you don't fall Unconscious at 0 hit points (you still make death saving throws)." },
        changes: [DDBEnricherData.ChangeHelper.unsignedAddChange("+@prof", 20, "system.bonuses.mwak.damage")],
      },
    ];
  }

}
