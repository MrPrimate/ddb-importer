import DDBEnricherData from "../data/DDBEnricherData";
import { itemUses } from "./_ItemActivities";

/**
 * Arcane Chatelaine: six spectral keys, each casting Arcane Lock once and then disappearing. DDB
 * ships the cast spending the item's uses but no uses, which dnd5e refuses, so the keys are six
 * uses that never come back.
 */
export default class ArcaneChatelaine extends DDBEnricherData {

  // the parser's bare "Use" activity does nothing, and with the item's uses it would spend them
  override get stopDefaultActivity(): boolean {
    return true;
  }

  override get override(): IDDBOverrideData {
    return itemUses(this, "6", []);
  }

}
