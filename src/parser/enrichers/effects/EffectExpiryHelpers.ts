import logger from "../../../lib/Logger";

/**
 * Expiry translation for dnd5e 6.0's `duration.expiry`
 */

const TIMED_EFFECT_EXPIRY_TYPES = [
  "turnStart", "turnEnd", "roundStart", "roundEnd", "combatStart", "combatEnd",
] as const;

export const PSEUDO_EXPIRIES: readonly string[] = ["sourceStart", "sourceEnd", "targetStart", "targetEnd"];
export const DURATIONLESS_EXPIRIES: readonly string[] = ["shortRest", "longRest"];

export const EFFECT_EXPIRY_TYPES = [
  ...PSEUDO_EXPIRIES,
  ...DURATIONLESS_EXPIRIES,
  ...TIMED_EFFECT_EXPIRY_TYPES,
] as const;

/**
 * Every token dnd5e 6.0 expresses natively on `duration.expiry`.
 * These are BANNED from `flags.dae.specialDuration`: an enricher states a turn edge with
 * `options.expiry`, and the prose parser computes the native expiry itself
 * (`DDBDescriptions.nextTurnExpiry`).
 */
export const NATIVE_EXPIRY_TOKENS: readonly string[] = [
  ...EFFECT_EXPIRY_TYPES,
  "turnStartSource",
  "turnEndSource",
];

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
 */
export function applyDaeSpecialDurations(effect: I5eEffectData, durations: TDAESpecialDuration[]): I5eEffectData {
  effect.duration ??= {};

  // the system evaluates pseudo expiries live and forces their duration null at creation
  if (!expirySupportsDuration(effect.duration.expiry)) {
    effect.duration.value = null;
  }

  for (const token of durations.filter((d) => NATIVE_EXPIRY_TOKENS.includes(d))) {
    logger.error(
      `Native expiry token "${token}" passed as a DAE special duration on effect "${effect.name}"; declare it with options.expiry instead - the token has been dropped`,
      { effect, durations },
    );
  }

  const durationsToFlag: TDAESpecialDuration[] = durations.filter((d) => !NATIVE_EXPIRY_TOKENS.includes(d));

  if (durationsToFlag.length > 0) foundry.utils.setProperty(effect, "flags.dae.specialDuration", durationsToFlag);
  return effect;
}
