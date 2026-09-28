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
        // Expiry only: a counted duration is a minimum the turn edge waits for, and a turn change
        // inside a round advances no world time, so a 6 s value kept Halted past the turn.
        options: {
          expiry: "turnEnd",
        },
        changes: [
          DDBEnricherData.ChangeHelper.movementMultiplierChange(0),
        ],
      },
    ];
  }

}
