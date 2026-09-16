import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Primal Knowledge (2024): while raging, Acrobatics, Intimidation, Perception, Stealth and
 * Survival checks can use Strength instead of their usual ability. The SRD
 * expresses that as a bonus of max(0, Str mod - skill mod) on each check for the rage's
 * duration; the DDB action supplies the toggle activity the effect hangs off.
 */
export default class PrimalKnowledge extends DDBEnricherData {

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get addToDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    if (!this.is2024 || this.isAction) return [];
    return [
      {
        name: "Primal Knowledge",
        activityMatch: "Rage: Primal Knowledge",
        changes: ["acr", "itm", "prc", "ste", "sur"].map((skill) =>
          DDBEnricherData.ChangeHelper.unsignedAddChange("max(0, @abilities.str.mod - @mod)", 20, `system.skills.${skill}.bonuses.check`),
        ),
        options: {
          durationSeconds: 600,
          description: "While raging, these skill checks use Strength when it is higher than their usual ability.",
        },
      },
    ];
  }

}
