import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Destructive Wave: creatures that fail the save are knocked Prone as well as taking the full damage.
 */
export default class DestructiveWave extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Prone",
        statuses: ["Prone"],
      },
    ];
  }

}
