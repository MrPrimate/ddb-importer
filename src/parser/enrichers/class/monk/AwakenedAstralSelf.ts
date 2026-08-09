import DDBEnricherData from "../../data/DDBEnricherData";

export default class AwakenedAstralSelf extends DDBEnricherData {

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get clearAutoEffects(): boolean {
    // The feature pulls in the same-named action before effects are added. A
    // feature-side clear would delete the cloned effect and orphan the
    // activity's effect link.
    return this.isAction;
  }

  override get effects(): IDDBEffectHint[] {
    // The action effect is cloned onto the parent with its activity.
    if (!this.isAction) return [];
    return [
      {
        name: "Armor of the Spirit",
        options: {
          description: "You gain +2 AC Bonus",
          durationSeconds: 600,
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("2", 20, "system.attributes.ac.bonus"),
        ],
      },
    ];
  }
}
