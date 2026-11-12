import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Dread Linnorm Bite (D&D Beyond Drops November 2026): a hit on a creature also gives it one
 * Exhaustion level, while the parser's attack and 1d10 self heal stay as built. The automatic
 * Twin Breath failure while the target is exhausted is left to the GM.
 */
export default class Bite extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Bite: Exhaustion",
        activityTypesMatch: [DDBEnricherData.ACTIVITY_TYPES.ATTACK],
        statuses: ["Exhaustion:1"],
        options: {
          durationSeconds: null,
          description: "Gains 1 Exhaustion level. While it has any Exhaustion levels, it automatically fails its saving throws against the linnorm's Twin Breath.",
        },
      },
    ];
  }

}
