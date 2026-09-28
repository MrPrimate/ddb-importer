/**
 * Why a template was offered for removal. The values are stable ids, returned by the public
 * `regionExpiry()` verdict; the dialog shows `ddb-importer.regionExpiry.reason.<id>`.
 */
export const REGION_EXPIRY_REASONS = {
  expired: "expired",
  deleted: "deleted",
  concentration: "concentration",
  combat: "combat",
  scene: "scene",
  duration: "duration",
} as const;


/** The localized label for a reason id, or the id itself for one this module does not know. */
export function regionExpiryReasonLabel(reason: string): string {
  const key = `ddb-importer.regionExpiry.reason.${reason}`;
  return game.i18n.has(key, false) ? game.i18n.localize(key) : reason;
}
