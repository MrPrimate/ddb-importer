import DDBEnricherData from "../data/DDBEnricherData";

/** The Magus Class cantrip: a failed save leaves the target overexposed (Critical Hits on 19-20 against it) until the start of the caster's next turn. */
export default class Overexposure extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Overexposed",
        options: {
          expiry: "sourceStart",
          description: "Attack rolls against this creature score a Critical Hit on a roll of 19 or 20 until the start of the caster's next turn, or until it takes a Critical Hit.",
        },
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange("set=19", 20, "flags.automated-conditions-5e.grants.attack.criticalThreshold"),
        ],
        midiChanges: [
          DDBEnricherData.ChangeHelper.overrideChange("19", 20, "flags.midi-qol.grants.criticalThreshold"),
        ],
      },
    ];
  }

}
