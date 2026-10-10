/**
 * Whether the character was in a D&D Beyond campaign at its last import. The campaign comes from
 * the character's own DDB data, not the module's campaign setting: DDB broadcasts each character
 * update to the game log of the campaign the character belongs to.
 */
export function hasDDBCampaign(actor: Actor.Implementation | Record<string, any>): boolean {
  return Number.isInteger(foundry.utils.getProperty(actor, "flags.ddbimporter.dndbeyond.campaign.id"));
}

/**
 * Whether changes to this actor are dynamically synced to D&D Beyond: dynamic updates are switched
 * on for the actor and the character is in a DDB campaign.
 */
export function isDynamicSyncActor(actor: Actor.Implementation | Record<string, any> | null | undefined): boolean {
  if (!actor) return false;
  return foundry.utils.getProperty(actor, "flags.ddbimporter.activeUpdate") === true && hasDDBCampaign(actor);
}
