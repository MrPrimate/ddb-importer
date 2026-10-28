import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Coven Patron (OTFY) parent feature. The benefit, with its use, lives on the coven's
 * "Voice of the Many: <Coven>" option document (_VoiceOfTheMany).
 */
export default class VoiceOfTheMany extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [];
  }

}
