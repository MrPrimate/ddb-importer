import RegionAutomations from "../../effects/auras/RegionAutomations";
import logger from "../../lib/Logger";

/**
 * Sweep the once-per-turn flags the ddbMacro region behaviors write onto actors.
 * They are keyed on a region and behavior that live only as long as the placed
 * template, so on a long lived world an actor otherwise collects one for every
 * region it has ever stood in. Only the active GM sweeps, and only world actors:
 * an unlinked token's flags live in its actor delta and go with the token.
 */
export async function pruneRegionTurnFlags(): Promise<void> {
  if (!game.user?.isActiveGM) return;
  try {
    const pruned = await RegionAutomations.pruneTurnFlags();
    if (pruned > 0) logger.info(`Pruned ${pruned} stale region once-per-turn flags`);
  } catch (error) {
    // housekeeping must never block world load
    logger.warn("Unable to prune stale region once-per-turn flags", { error });
  }
}
