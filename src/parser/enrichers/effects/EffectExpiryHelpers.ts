import logger from "../../../lib/Logger";

/**
 * Expiry translation for Foundry v14 `duration.expiry` under dnd5e 5.3.
 *
 * Enrichers share their expiry vocabulary with the dnd5e 6.0 branch, but dnd5e 5.3 only has the
 * core Foundry combat events:
 * - timed expiries (turnStart, turnEnd, roundStart...) are core and written as they are;
 * - source/target turn edges are expiry events DAE registers on dnd5e < 6.0, so they are written
 *   as they are when DAE is active and fall back to a core turn edge without it (see
 *   PSEUDO_EXPIRY_FALLBACK);
 * - rest expiries have no 5.3 event, so they become DAE special-duration tokens.
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
 * Where a pseudo expiry lands when DAE is not there to register it. Core turnStart/turnEnd only fire
 * for the combatant whose turn it was when the effect was created (normally the source), and do not
 * skip that turn, so:
 * - sourceStart is the source's next turn start;
 * - sourceEnd is turnEnd with a one-round counted duration (SOURCE_END_FALLBACK_SECONDS), which skips
 *   the end of the turn the effect was applied on;
 * - targetStart and targetEnd both become the source's next turn start, the first core edge that is
 *   sure to come after the target's next turn. That can outlast a targetStart effect by the rest of
 *   the target's turn, but never ends one before the target has acted.
 */
const PSEUDO_EXPIRY_FALLBACK: Record<string, TEffectDurationExpiry> = {
  sourceStart: "turnStart",
  sourceEnd: "turnEnd",
  targetStart: "turnStart",
  targetEnd: "turnStart",
};

/** One combat round (dnd5e sets CONFIG.time.roundTime to 6); world time advances by it each round. */
const SOURCE_END_FALLBACK_SECONDS = 6;

/**
 * Legacy DAE turn-edge tokens, still written by older enrichers and the description parser as
 * `daeSpecialDurations`. DAE itself migrates these onto `duration.expiry` at effect creation.
 */
const LEGACY_TURN_TOKENS: Record<string, T5eEffectExpiry> = {
  turnStart: "targetStart",
  turnEnd: "targetEnd",
  turnStartSource: "sourceStart",
  turnEndSource: "sourceEnd",
  combatEnd: "combatEnd",
  sourceStart: "sourceStart",
  sourceEnd: "sourceEnd",
  targetStart: "targetStart",
  targetEnd: "targetEnd",
};

/** Whether DAE is active and registers the source/target expiry events (it only does below dnd5e 6.0). */
export function daeManagesTurnExpiry(): boolean {
  const daeActive = game.modules?.get("dae")?.active ?? false;
  return daeActive && !foundry.utils.isNewerVersion(game.system?.version ?? "5.3.0", "5.99.99");
}

/**
 * Pseudo and durationless expiries end the effect at their first event, so the effect must carry
 * no counted duration beside them: Foundry only expires an effect at an expiry event once its
 * counted duration has run out.
 */
export function expirySupportsDuration(expiry: string | null | undefined): boolean {
  return !PSEUDO_EXPIRIES.includes(expiry ?? "")
    && !DURATIONLESS_EXPIRIES.includes(expiry ?? "");
}

/** The `duration.expiry` value an expiry hint is written as on this branch, or null for a rest expiry. */
export function nativeExpiry(expiry: T5eEffectExpiry | null | undefined): T5eEffectExpiry | null {
  if (!expiry) return null;
  if (DURATIONLESS_EXPIRIES.includes(expiry)) return null;
  if (PSEUDO_EXPIRIES.includes(expiry) && !daeManagesTurnExpiry()) return PSEUDO_EXPIRY_FALLBACK[expiry];
  return expiry;
}

function addDaeTokens(effect: I5eEffectData, tokens: TDAESpecialDuration[]): void {
  if (tokens.length === 0) return;
  const existing = (effect.flags?.dae?.specialDuration ?? []) as TDAESpecialDuration[];
  const merged = Array.from(new Set([...existing, ...tokens]));
  foundry.utils.setProperty(effect, "flags.dae.specialDuration", merged);
}

/**
 * Stamp `duration.expiry` from an enricher's `options.expiry` hint (or a parsed one), nulling the
 * counted duration for expiries that end the effect at their first event. `null` clears the expiry.
 * Without DAE a sourceEnd expiry instead carries one round, so its core turnEnd fallback skips the
 * turn the effect was applied on.
 */
export function applyNativeExpiry(effect: I5eEffectData, expiry: T5eEffectExpiry | null): I5eEffectData {
  effect.duration ??= {};
  if (expiry && DURATIONLESS_EXPIRIES.includes(expiry)) {
    effect.duration.expiry = null;
    effect.duration.value = null;
    addDaeTokens(effect, [expiry as TDAESpecialDuration]);
    return effect;
  }
  effect.duration.expiry = nativeExpiry(expiry);
  if (expiry === "sourceEnd" && !daeManagesTurnExpiry()) {
    effect.duration.value = SOURCE_END_FALLBACK_SECONDS;
    effect.duration.units = "seconds";
  } else if (expiry && !expirySupportsDuration(expiry)) {
    effect.duration.value = null;
  }
  return effect;
}

/**
 * Write DAE special-duration flags. Legacy turn-edge tokens (turnStart, turnEndSource...) are moved
 * onto `duration.expiry` instead, the first one winning as DAE's own migration does; everything else
 * (usage counts, triggers, rests) stays a DAE flag.
 */
export function applyDaeSpecialDurations(effect: I5eEffectData, durations: TDAESpecialDuration[]): I5eEffectData {
  effect.duration ??= {};

  const turnToken = durations.find((d) => d in LEGACY_TURN_TOKENS);
  if (turnToken) {
    applyNativeExpiry(effect, LEGACY_TURN_TOKENS[turnToken]);
    const ignored = durations.filter((d) => d !== turnToken && d in LEGACY_TURN_TOKENS);
    if (ignored.length > 0) {
      logger.debug(`Effect "${effect.name}" has more than one turn-edge special duration; using ${turnToken}`, { effect, durations });
    }
  }

  addDaeTokens(effect, durations.filter((d) => !(d in LEGACY_TURN_TOKENS)));
  return effect;
}

export default {
  PSEUDO_EXPIRIES,
  DURATIONLESS_EXPIRIES,
  EFFECT_EXPIRY_TYPES,
  daeManagesTurnExpiry,
  expirySupportsDuration,
  nativeExpiry,
  applyNativeExpiry,
  applyDaeSpecialDurations,
};
