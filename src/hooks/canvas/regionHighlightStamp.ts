import logger from "../../lib/Logger";

/**
 * Copy an activity's highlight choice onto the regions it is about to place.
 *
 * dnd5e creates the Region documents first and their behaviors afterwards (and only on the
 * active GM), so the appearance cannot be read off the region's behaviors at draw time. The
 * `dnd5e.createMeasuredTemplate` hook fires with the mutable creation data before the
 * documents exist, which is where the flag goes.
 */

const LOG = "RegionHighlight |";

interface IActivityBehaviorLike {
  type?: string;
  config?: Record<string, unknown> | null;
}

interface IActivityLike {
  uuid?: string;
  applicableBehaviors?: IActivityBehaviorLike[] | null;
  behaviors?: Iterable<IActivityBehaviorLike> | null;
}

function overrideValue(value: unknown): number | string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") return value.trim() ? value.trim() : null;
  return null;
}

/**
 * The flag an activity's behaviors ask for: a `ddbHighlight` behavior wins, otherwise the
 * first `ddbMacro` trigger naming a profile. Null when the activity makes no choice.
 */
export function activityHighlightChoice(activity: IActivityLike | null | undefined): IRegionHighlightFlag | null {
  if (!activity) return null;
  const behaviors = [...(activity.applicableBehaviors ?? activity.behaviors ?? [])];
  const appearance = behaviors.find((behavior) => behavior.type === "ddbHighlight");
  if (appearance) {
    const config = appearance.config ?? {};
    const profile = typeof config.profile === "string" ? config.profile : "";
    if (!profile) return null;
    const flag: IRegionHighlightFlag = { profile };
    const pattern = overrideValue(config.pattern);
    if (pattern) flag.pattern = pattern as TRegionHighlightPattern;
    for (const key of [
      "opacity",
      "gapOpacity",
      "borderOpacity",
      "spacing",
      "thickness",
      "edgeWidth",
      "dashLength",
      "angle",
      "borderWidth",
    ] as const) {
      const value = overrideValue(config[key]);
      if (value !== null) flag[key] = value;
    }
    if (typeof config.dashed === "boolean" || config.dashed === "dashed" || config.dashed === "continuous") {
      flag.dashed = config.dashed;
    }
    if (typeof config.border === "boolean" || config.border === "border" || config.border === "none") {
      flag.border = config.border;
    }
    const color = overrideValue(config.color);
    if (typeof color === "string") flag.color = color;
    return flag;
  }
  const trigger = behaviors.find(
    (behavior) =>
      behavior.type === "ddbMacro" &&
      typeof behavior.config?.highlightProfile === "string" &&
      behavior.config.highlightProfile,
  );
  if (trigger) return { profile: trigger.config?.highlightProfile as string };
  return null;
}

/** Stamp the choice onto each region's creation data, leaving any flag the caller already set. */
export function stampRegionHighlight(
  activity: IActivityLike | null | undefined,
  regionData: Record<string, unknown>[],
): void {
  const choice = activityHighlightChoice(activity);
  if (!choice) return;
  let stamped = 0;
  for (const data of regionData ?? []) {
    if (foundry.utils.hasProperty(data, "flags.ddbimporter.highlight")) continue;
    foundry.utils.setProperty(data, "flags.ddbimporter.highlight", foundry.utils.deepClone(choice));
    stamped++;
  }
  logger.debug(`${LOG} stamped profile "${choice.profile}" on ${stamped} region(s)`, { activity: activity?.uuid });
}

export function registerRegionHighlightStamp(): void {
  Hooks.on<"dnd5e.createMeasuredTemplate">("dnd5e.createMeasuredTemplate", (activity, regionData) => {
    stampRegionHighlight(activity as unknown as IActivityLike, regionData as unknown as Record<string, unknown>[]);
  });
}
