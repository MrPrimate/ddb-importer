/**
 * Why a template was offered for removal.
 */
export const REGION_EXPIRY_REASONS = {
  expired: "duration expired",
  deleted: "effect removed",
  concentration: "concentration ended",
  combat: "combat ended",
  scene: "scene sweep",
  duration: "duration elapsed",
} as const;

export type TRegionExpiryReason = typeof REGION_EXPIRY_REASONS[keyof typeof REGION_EXPIRY_REASONS];
