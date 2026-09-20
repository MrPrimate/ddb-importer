import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Laeral's Silver Lance: creatures that fail the save are also knocked Prone.
 */
export default class LaeralsSilverLance extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Prone",
        statuses: ["Prone"],
      },
    ];
  }

}
