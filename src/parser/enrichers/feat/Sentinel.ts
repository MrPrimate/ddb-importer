import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Sentinel: a creature hit by the opportunity attack has its speed reduced to 0 for the rest of
 * the current turn. The DDB action supplies the attack trigger; this links the Halted effect.
 */
export default class Sentinel extends DDBEnricherData {

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get addToDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Halted",
        activityMatch: "Sentinel Attack",
        // "the creature's Speed becomes 0": every movement mode, not only walking
        changes: [
          DDBEnricherData.ChangeHelper.customChange("*0", 20, "system.attributes.movement.all"),
          ...["walk", "fly", "swim", "climb", "burrow"].map((mode) =>
            DDBEnricherData.ChangeHelper.overrideChange("0", 60, `system.attributes.movement.${mode}`)),
        ],
        // "for the rest of the current turn"
        options: {
          durationTurns: 1,
          expiry: "turnEnd",
        },
      },
    ];
  }

}
