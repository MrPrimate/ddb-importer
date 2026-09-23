import { REGION_DISPLAY_BEHAVIOR_TYPE, REGION_DISPLAY_FLAG_PATH, REGION_DISPLAY_LOG } from "../../config/regionDisplayProfiles";
import logger from "../../lib/Logger";
import { flagFromBehaviorConfig } from "./regionDisplaySummary";

/**
 * Copy an activity's display choice onto the regions it is about to place.
 *
 * dnd5e creates the Region documents first and their behaviors afterwards (and only on the
 * active GM), so the display cannot be read off the region's behaviors at draw time. The
 * `dnd5e.createMeasuredTemplate` hook fires with the mutable creation data before the
 * documents exist, which is where the flag goes.
 */

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
 * The flag an activity's behaviors ask for: a `ddbDisplay` behavior wins, otherwise the
 * first `ddbMacro` trigger naming a profile. Null when the activity makes no choice.
 */
export function activityDisplayChoice(activity: IActivityLike | null | undefined): IRegionDisplayFlag | null {
  if (!activity) return null;
  const behaviors = [...(activity.applicableBehaviors ?? activity.behaviors ?? [])];
  const display = behaviors.find((behavior) => behavior.type === REGION_DISPLAY_BEHAVIOR_TYPE);
  if (display) {
    const flag = flagFromBehaviorConfig(display.config);
    return flag.profile ? flag : null;
  }
  const trigger = behaviors.find(
    (behavior) =>
      behavior.type === "ddbMacro" &&
      typeof behavior.config?.displayProfile === "string" &&
      behavior.config.displayProfile,
  );
  if (trigger) return { profile: trigger.config?.displayProfile as string };
  return null;
}

/** Stamp the choice onto each region's creation data, leaving any flag the caller already set. */
export function stampRegionDisplay(
  activity: IActivityLike | null | undefined,
  regionData: Record<string, unknown>[],
): void {
  const choice = activityDisplayChoice(activity);
  if (!choice) return;
  let stamped = 0;
  for (const data of regionData ?? []) {
    if (foundry.utils.hasProperty(data, REGION_DISPLAY_FLAG_PATH)) continue;
    foundry.utils.setProperty(data, REGION_DISPLAY_FLAG_PATH, foundry.utils.deepClone(choice));
    stamped++;
  }
  logger.debug(`${REGION_DISPLAY_LOG} stamped profile "${choice.profile}" on ${stamped} region(s)`, { activity: activity?.uuid });
}

export function registerRegionDisplayStamp(): void {
  Hooks.on<"dnd5e.createMeasuredTemplate">("dnd5e.createMeasuredTemplate", (activity, regionData) => {
    stampRegionDisplay(activity as unknown as IActivityLike, regionData as unknown as Record<string, unknown>[]);
  });
}
