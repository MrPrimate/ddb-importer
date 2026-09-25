import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Potion of Greater Invisibility: Invisible for 1 hour, attacking and casting do not end it.
 */
export default class PotionOfGreaterInvisibility extends DDBEnricherData {
  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Invisible",
        statuses: ["Invisible"],
        options: {
          transfer: false,
          durationSeconds: 3600,
        },
      },
    ];
  }

}
