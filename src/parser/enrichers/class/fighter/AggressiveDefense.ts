import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * No AC5e opt-in here: spending a chosen amount of Temporary Hit Points for that much damage needs
 * AC5e's scaled opt-ins (`bonusScale`), which the Foundry 13 releases of AC5e do not have.
 */
export default class AggressiveDefense extends DDBEnricherData {

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

}
