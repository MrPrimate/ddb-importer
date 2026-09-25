import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Etherealness: the target steps into the Border Ethereal for the duration.
 */
export default class Etherealness extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Etherealness",
        statuses: ["Ethereal"],
      },
    ];
  }

}
