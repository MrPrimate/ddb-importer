import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Potion of Invisibility: Invisible for 1 hour.
 */
export default class PotionOfInvisibility extends DDBEnricherData {
  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Invisible",
        statuses: ["Invisible"],
        options: {
          durationSeconds: 3600,
        },
      },
    ];
  }

}
