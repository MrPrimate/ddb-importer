import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Wings of Flying: the wings, and their 60 ft fly speed, last 1 hour once the cloak is turned into
 * them, so the speed rides on the activity's effect rather than on the cloak while worn.
 */
export default class WingsOfFlying extends DDBEnricherData {

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Wings of Flying",
        options: {
          transfer: false,
          durationSeconds: 3600,
          description: "The wings last for 1 hour or until dismissed. If you are aloft when they disappear, you fall; you can't use them again for 1d12 hours.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange(60, 20, "system.attributes.movement.fly"),
        ],
      },
    ];
  }

}
