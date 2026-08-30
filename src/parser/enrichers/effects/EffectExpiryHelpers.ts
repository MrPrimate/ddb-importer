/**
 * Expiry translation for dnd5e 6.0's `duration.expiry`
 */

const EFFECT_EXPIRY_TYPES = [
  "turnStart", "turnEnd", "roundStart", "roundEnd", "combatStart", "combatEnd",
] as const;

export const DAE_EFFECT_EXPIRY_TYPES = [
  ...EFFECT_EXPIRY_TYPES,
  "sourceStart", "sourceEnd", "targetStart", "targetEnd",
] as const;

export const PSEUDO_EXPIRIES: readonly string[] = ["sourceStart", "sourceEnd", "targetStart", "targetEnd"];

export const DURATIONLESS_EXPIRIES: readonly string[] = ["shortRest", "longRest"];

/**
 * Mirror of dnd5e's `ActiveEffect5e#expirySupportsDuration`: pseudo and durationless expiries
 * cannot carry a counted duration, and the system nulls `duration.value` for them
 */
export function expirySupportsDuration(expiry: string | null | undefined): boolean {
  return !PSEUDO_EXPIRIES.includes(expiry ?? "")
    && !DURATIONLESS_EXPIRIES.includes(expiry ?? "");
}

/**
 * Stamp a native `duration.expiry` from an enricher's `options.expiry` hint.
 * Nulling the value for expiries that cannot carry one
 */
export function applyNativeExpiry(effect: I5eEffectData, expiry: T5eEffectExpiry | null): I5eEffectData {
  effect.duration ??= {};
  effect.duration.expiry = expiry;
  if (expiry && !expirySupportsDuration(expiry)) effect.duration.value = null;
  return effect;
}

/**
 * Write DAE special-duration FLAGS for the tokens dnd5e cannot express natively
 * (usage counts and triggers: 1Attack, isSave, isDamaged...).
 *
 * Previpously this traslated values into `duration.expiry`  it now handles the DAE-only remainder.
 *
 * Legacy `turnStart`/`turnEnd` style tokens are filtered from the flag as
 * natively covered; the source variants are deliberately NOT in
 * `DAE_EFFECT_EXPIRY_TYPES`, so they stay in the flag for DAE worlds.
 */
export function applyDaeSpecialDurations(effect: I5eEffectData, durations: TDAESpecialDuration[]): I5eEffectData {
  effect.duration ??= {};

  // the system evaluates pseudo expiries live and forces their duration null at creation
  if (!expirySupportsDuration(effect.duration.expiry)) {
    effect.duration.value = null;
  }

  const durationsToFlag: TDAESpecialDuration[] = durations.filter((d) =>
    !(DAE_EFFECT_EXPIRY_TYPES as readonly string[]).includes(d),
  );

  if (durationsToFlag.length > 0) foundry.utils.setProperty(effect, "flags.dae.specialDuration", durationsToFlag);
  return effect;
}
