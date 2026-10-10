import DDBEnricherData from "../data/DDBEnricherData";

/** Sif's Arrow: for a minute, ranged weapon hits deal extra damage of the weapon's type equal to your proficiency bonus, once on each of your turns. */
export default class GreaterBlessingOfSif extends DDBEnricherData {

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Sif's Arrow",
        activityMatch: "Sif's Arrow",
        options: { durationSeconds: 60, description: "Ranged weapon hits deal extra damage equal to your proficiency bonus, no more than once on each of your turns." },
        changes: [DDBEnricherData.ChangeHelper.unsignedAddChange("+@prof", 20, "system.bonuses.rwak.damage")],
      },
    ];
  }

}
