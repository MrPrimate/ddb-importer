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
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange("0", 20, "system.attributes.movement.walk"),
        ],
        data: {
          duration: {
            value: 6,
            expiry: "turnEnd",
            expired: null,
          },
        },
      },
    ];
  }

}
