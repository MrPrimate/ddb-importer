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

/**
 * The counted backstop for a turn-edge expiry that DAE ends through its turn tokens. "Until the end
 * of its next turn" on a self buff, or "until the end of your next turn", ends a full round and a
 * turn after it is applied, so an end edge needs two rounds or times-up removes the effect before
 * DAE's token fires; a start edge is reached within one.
 */
const PSEUDO_EXPIRY_BACKSTOP: Partial<Record<TDDBEffectExpiry, { seconds: number; rounds: number }>> = {
  sourceStart: { seconds: 6, rounds: 1 },
  targetStart: { seconds: 6, rounds: 1 },
  sourceEnd: { seconds: 12, rounds: 2 },
  targetEnd: { seconds: 12, rounds: 2 },
};

export function pseudoExpiryBackstop(expiry: TDDBEffectExpiry | null | undefined): { seconds: number; rounds: number } | null {
  if (!expiry) return null;
  return PSEUDO_EXPIRY_BACKSTOP[expiry] ?? null;
}

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

/**
 * Applies an expiry to an effect built outside the enricher mixin (a monster's rider effect).
 * Foundry 13 has no `duration.expiry`: a turn edge becomes its DAE token with a counted backstop
 * that outlasts it, and a timed expiry its counted stand-in when the effect has no duration yet.
 * The backstop raises a shorter counted duration: the parser reads "until the end of its next turn"
 * as 6 seconds, which times-up would expire before that turn ends.
 */
export function applyDaeExpiry(effect: I5eEffectData, expiry: TDDBEffectExpiry | null): I5eEffectData {
  if (!expiry) return effect;
  const tokens = expiryToDaeSpecialDurations(expiry);
  if (tokens.length > 0) {
    const existing = (foundry.utils.getProperty(effect, "flags.dae.specialDuration") as DAESpecialDuration[] | undefined) ?? [];
    foundry.utils.setProperty(effect, "flags.dae.specialDuration", [...new Set([...existing, ...tokens])]);
  }
  const backstop = pseudoExpiryBackstop(expiry);
  if (backstop) {
    effect.duration = {
      ...(effect.duration ?? {}),
      seconds: Math.max(effect.duration?.seconds ?? 0, backstop.seconds),
      rounds: Math.max(effect.duration?.rounds ?? 0, backstop.rounds),
    };
    return effect;
  }
  if (effect.duration?.seconds || effect.duration?.rounds || effect.duration?.turns) return effect;
  const fallback = expiryFallbackDuration(expiry);
  if (fallback) effect.duration = { ...(effect.duration ?? {}), ...fallback };
  return effect;
}

interface ICountedDuration {
  seconds: number | null;
  rounds: number | null;
  turns: number | null;
}

/** The counted part of a Foundry 13 effect duration, or null when it has none. */
function countedDuration(duration: Partial<IEffectDuration> | null | undefined): ICountedDuration | null {
  const seconds = duration?.seconds || null;
  const rounds = duration?.rounds || null;
  const turns = duration?.turns || null;
  return seconds || rounds || turns ? { seconds, rounds, turns } : null;
}

/** A rough length in seconds, only for picking the longest of several durations. */
function countedLength(duration: ICountedDuration): number {
  return duration.seconds ?? ((duration.rounds ?? 0) * 6) + (duration.turns ?? 0);
}

/**
 * Move counted durations off an item's rider source effects onto their enchantment profiles.
 *
 * dnd5e copies an enchantment's rider effects when it applies the enchantment and deletes the
 * copies with it, so the enchantment is what carries the lifetime. A counted duration on the rider's
 * source effect does harm on Foundry 13: times-up stamps an item's transfer effects when the item is
 * created and disables them once that time passes, used or not, and every later copy then starts
 * disabled. A profile without a counted duration of its own takes the longest of its riders'.
 */
export function moveRiderDurationsToProfiles(document: {
  effects?: { _id?: string | null; duration?: Partial<IEffectDuration> | null }[];
  system?: { activities?: Record<string, any> };
}): void {
  const effects = document.effects ?? [];
  const byId = new Map(effects.filter((effect) => effect._id).map((effect) => [effect._id as string, effect]));
  const riderIds = new Set<string>();
  for (const activity of Object.values(document.system?.activities ?? {})) {
    if (activity?.type !== "enchant") continue;
    for (const link of activity.effects ?? []) {
      const ids: string[] = link.riders?.effect ?? [];
      if (ids.length === 0) continue;
      ids.forEach((id) => riderIds.add(id));
      const profile = byId.get(link._id);
      if (!profile || countedDuration(profile.duration)) continue;
      const longest = ids
        .map((id) => countedDuration(byId.get(id)?.duration))
        .filter((duration): duration is ICountedDuration => duration !== null)
        .sort((a, b) => countedLength(b) - countedLength(a))[0];
      if (longest) profile.duration = { ...(profile.duration ?? {}), ...longest };
    }
  }
  for (const id of riderIds) {
    const effect = byId.get(id);
    if (!effect?.duration) continue;
    effect.duration = { ...effect.duration, seconds: null, rounds: null, turns: null };
  }
}

export default {
  expiryToDaeSpecialDurations,
  resolveDaeSpecialDurations,
  expiryFallbackDuration,
  resolveExpiryFallback,
  pseudoExpiryBackstop,
  moveRiderDurationsToProfiles,
};
