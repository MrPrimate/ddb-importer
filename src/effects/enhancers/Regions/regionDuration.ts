/**
 * Region lifetimes from an activity's duration, shared by the owner-turn behavior data model and
 * the expiry cleanup enhancer. No imports on purpose, so neither pulls in the other's import graph.
 */

/**
 * Activity duration units (singular, CONFIG.DND5E.timeUnits) mapped to ActiveEffect duration units (plural).
 * Only used when a prepared activity does not expose `duration.getEffectData`
 */
const ACTIVITY_TO_EFFECT_UNITS: Record<string, string> = {
  turn: "turns",
  round: "rounds",
  second: "seconds",
  minute: "minutes",
  hour: "hours",
  day: "days",
  month: "months",
  year: "years",
};

/** A duration in ActiveEffect terms: plural units, a positive value. */
interface IRegionDuration {
  value: number;
  units: string;
}

/**
 * An activity's duration in ActiveEffect duration terms, through dnd5e's own `getEffectData` when
 * the activity is prepared. "inst", "perm", "spec" and formula-valued durations yield null: those
 * regions have no intrinsic lifetime.
 */
export function activityEffectDuration(activity: unknown): IRegionDuration | null {
  const duration = (activity as { duration?: Record<string, unknown> } | null)?.duration;
  if (!duration) return null;
  const getEffectData = duration["getEffectData"];
  const data = (typeof getEffectData === "function"
    ? (getEffectData as () => { value?: unknown; units?: string }).call(duration)
    : null) ?? {};
  const value = Number(data.value ?? duration["value"]);
  const units = data.units ?? ACTIVITY_TO_EFFECT_UNITS[String(duration["units"])];
  if (!units || !Number.isFinite(value) || (value <= 0)) return null;
  return { value, units };
}

/**
 * The seconds a duration spans on the world clock, matching core's
 * `ActiveEffect#_prepareTimeBasedDuration`: calendar units through the calendar, a month as the
 * calendar's average month rounded up to whole days, and rounds or turns through
 * `CONFIG.time.roundTime` / `turnTime`. Null when the duration has no length on the world clock,
 * such as turns under dnd5e, whose `turnTime` is 0.
 */
export function durationSeconds({ value, units }: IRegionDuration): number | null {
  if ((units === "rounds") || (units === "turns")) {
    const perUnit = Number((CONFIG.time as unknown as Record<string, unknown> | undefined)?.[
      units === "turns" ? "turnTime" : "roundTime"
    ] ?? 0);
    return perUnit > 0 ? value * perUnit : null;
  }
  const calendar = game.time?.calendar;
  if (!calendar) return null;
  let seconds: number;
  if (units === "months") {
    const months = calendar.months?.values?.length ?? 0;
    if (!months) return null;
    seconds = calendar.componentsToTime({ day: Math.ceil(value * calendar.days.daysPerYear / months) });
  } else {
    seconds = calendar.componentsToTime({ [units.replace(/s$/, "")]: value });
  }
  return Number.isFinite(seconds) && (seconds > 0) ? seconds : null;
}
