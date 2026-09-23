import logger from "../../lib/Logger";
import { flagFromBehaviorConfig } from "./regionHighlightSummary";

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

/**
 * The flag an activity's behaviors ask for: a `ddbHighlight` behavior wins, otherwise the
 * first `ddbMacro` trigger naming a profile. Null when the activity makes no choice.
 */
export function activityHighlightChoice(activity: IActivityLike | null | undefined): IRegionHighlightFlag | null {
  if (!activity) return null;
  const behaviors = [...(activity.applicableBehaviors ?? activity.behaviors ?? [])];
  const appearance = behaviors.find((behavior) => behavior.type === "ddbHighlight");
  if (appearance) {
    const flag = flagFromBehaviorConfig(appearance.config);
    return flag.profile ? flag : null;
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
