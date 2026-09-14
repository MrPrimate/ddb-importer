import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Oil of Etherealness: the target is Ethereal for 1 hour.
 */
export default class OilOfEtherealness extends DDBEnricherData {
  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Etherealness",
        statuses: ["Ethereal"],
        options: {
          durationSeconds: 3600,
        },
      },
    ];
  }

}
