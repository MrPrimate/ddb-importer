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

/**
 * The counted duration a timed-expiry hint should end up with, or null to leave the effect alone.
 *
 * An explicit `durationSeconds: null` beside the expiry is the shared enrichers' way of saying
 * "no counted duration, the expiry is the whole lifetime", so there the stand-in replaces whatever
 * the host spell or its description stamped (Globe of Twilight's blindness ends that turn, not
 * after the globe's ten minutes). An undeclared durationSeconds keeps an inherited duration, as it
 * does on v14 (Evil Eye: one minute, checked at the turn start), and only an effect with no
 * duration at all takes the stand-in.
 * @param {object} options
 * @param {IDDBEffectOptions} options.effectOptions  The hint's options, as declared.
 * @param {Partial<IEffectDuration>|null} [options.inherited]  The duration already on the effect.
 */
export function resolveExpiryFallback({ effectOptions, inherited }: {
  effectOptions: IDDBEffectOptions;
  inherited?: Partial<IEffectDuration> | null;
}): { seconds: null; rounds: number | null; turns: number | null } | null {
  const fallback = expiryFallbackDuration(effectOptions.expiry);
  if (!fallback) return null;
  if (effectOptions.durationSeconds || effectOptions.durationRounds || effectOptions.durationTurns) return null;
  const expiryOwnsDuration = "durationSeconds" in effectOptions && effectOptions.durationSeconds === null;
  const inheritedCounted = inherited?.seconds || inherited?.rounds || inherited?.turns;
  if (inheritedCounted && !expiryOwnsDuration) return null;
  return { seconds: null, rounds: fallback.rounds ?? null, turns: fallback.turns ?? null };
}

export default {
  expiryToDaeSpecialDurations,
  resolveDaeSpecialDurations,
  expiryFallbackDuration,
  resolveExpiryFallback,
};
