import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Deadeye ranged critical range: 19 at level 2, 18 at 9, 17 at 17. DDB ships the thresholds as a
 * level scale on the feature, so the Deadeye scale advancement carries them as
 * `@scale.deadeye.critical-shot`. Core dnd5e only has an unconditional actor-wide threshold, so
 * the ranged-weapon restriction needs a module: AC5e's threshold flag with an `actionType.rwak`
 * condition, or midi's per-action-type critical flag.
 */
export default class CriticalShot extends DDBEnricherData {

  static SCALE = "@scale.deadeye.critical-shot";

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Critical Shot",
        ac5eOnly: true,
        options: {
          transfer: true,
        },
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange(
            `set=${CriticalShot.SCALE}; actionType.rwak`,
            20,
            "flags.automated-conditions-5e.attack.criticalThreshold",
          ),
        ],
      },
      {
        name: "Critical Shot",
        midiOnly: true,
        ac5eNever: true,
        options: {
          transfer: true,
        },
        midiChanges: [
          DDBEnricherData.ChangeHelper.overrideChange(CriticalShot.SCALE, 20, "flags.midi-qol.critical.rwak"),
        ],
      },
    ];
  }

}
