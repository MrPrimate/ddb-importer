import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Philter of Love: Charmed for 10 minutes by the first creature seen.
 */
export default class PhilterOfLove extends DDBEnricherData {
  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "In Love",
        statuses: ["Charmed"],
        options: {
          transfer: false,
          durationSeconds: 600,
        },
      },
    ];
  }

}
