/**
 * Translate the native effect expiry points used by enrichers shared with the Foundry v14 branch
 * into DAE special durations. Foundry v13 has no `duration.expiry` field, so an expiry can only
 * be honoured when DAE is installed and a matching token exists.
 *
 * Timed expiries (turnStart, turnEnd, roundStart, roundEnd, combatStart) have no DAE token that
 * matches the v14 semantics; the counted duration is left to times-up. `null` means the enricher
 * owns expiry and any description-derived token should be cleared.
 */
const EXPIRY_TO_DAE: Record<string, DAESpecialDuration[]> = {
  sourceStart: ["turnStartSource"],
  sourceEnd: ["turnEndSource"],
  targetStart: ["turnStart"],
  targetEnd: ["turnEnd"],
  shortRest: ["shortRest"],
  longRest: ["longRest"],
  combatEnd: ["combatEnd"],
};

export function expiryToDaeSpecialDurations(expiry: TDDBEffectExpiry | null | undefined): DAESpecialDuration[] {
  if (!expiry) return [];
  return EXPIRY_TO_DAE[expiry] ?? [];
}

/**
 * The DAE special durations an effect hint should carry.
 *
 * A hint's own `daeSpecialDurations` and the tokens translated from `options.expiry` are both
 * expiry *conditions*, and DAE ends the effect when any one of them fires, so they are unioned
 * rather than one replacing the other. Guiding Bolt expires on the first attack against the target
 * ("isAttacked") **or** at the end of the caster's turn; letting the expiry win left it granting
 * advantage on every subsequent attack until that turn ended.
 *
 * `expiry: null` still clears: it means the enricher owns expiry, and with no tokens of its own
 * the result is the empty list that overwrites anything derived from the description.
 * @param {object} options
 * @param {DAESpecialDuration[]} [options.daeSpecialDurations]  Tokens declared by the hint.
 * @param {TDDBEffectExpiry|null} [options.expiry]  The hint's `options.expiry`, when it declares one.
 * @param {boolean} [options.hasExpiry]  Whether `options.expiry` was declared at all.
 */
export function resolveDaeSpecialDurations({ daeSpecialDurations, expiry, hasExpiry = false }: {
  daeSpecialDurations?: DAESpecialDuration[] | null;
  expiry?: TDDBEffectExpiry | null;
  hasExpiry?: boolean;
}): DAESpecialDuration[] {
  const merged = new Set<DAESpecialDuration>(daeSpecialDurations ?? []);
  if (hasExpiry) for (const duration of expiryToDaeSpecialDurations(expiry)) merged.add(duration);
  return Array.from(merged);
}

/**
 * The counted duration that stands in for a timed expiry. Enrichers shared with the Foundry v14
 * branch declare "until the end of the turn" as `expiry: "turnEnd"` alone; here that has no DAE
 * token, so without a counted duration the effect would never end. Only used when the hint and
 * the host document supply no counted duration of their own.
 */
const EXPIRY_TO_COUNTED: Partial<Record<TDDBEffectExpiry, { rounds?: number; turns?: number }>> = {
  turnStart: { turns: 1 },
  turnEnd: { turns: 1 },
  roundStart: { rounds: 1 },
  roundEnd: { rounds: 1 },
};

export function expiryFallbackDuration(expiry: TDDBEffectExpiry | null | undefined): { rounds?: number; turns?: number } | null {
  if (!expiry) return null;
  return EXPIRY_TO_COUNTED[expiry] ?? null;
}

export default {
  expiryToDaeSpecialDurations,
  resolveDaeSpecialDurations,
  expiryFallbackDuration,
};
