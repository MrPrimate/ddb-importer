import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Consumables the parser builds with a follow-up activity used after the one that spends the item
 * (an escape check, a save against the effect). Using the item takes one from the stack's quantity,
 * and the item stays at quantity 0 so the follow-up is still on the sheet.
 */
export default class FollowUpConsumable extends DDBEnricherData {

  override get override(): IDDBOverrideData {
    return { spendOwnQuantity: true };
  }

}
