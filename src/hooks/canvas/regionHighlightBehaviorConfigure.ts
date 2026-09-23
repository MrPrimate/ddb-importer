import DDBRegionHighlightConfig from "../../apps/DDBRegionHighlightConfig";
import logger from "../../lib/Logger";

/**
 * Route the Configure button of a `ddbHighlight` behavior row on an activity sheet to the
 * region texture editor. dnd5e serialises behavior fields to HTML before rendering, so the
 * button cannot carry a listener; one document-level delegate serves every sheet. The
 * behavior is found by the `data-behavior-id` dnd5e puts on each row and the activity
 * through the sheet the button sits in.
 */

export const BEHAVIOR_CONFIGURE_CLASS = "ddbi-highlight-behavior-configure";

interface IActivitySheetLike {
  element?: HTMLElement | null;
  activity?: unknown;
}

/** The open application whose window holds an element. */
function appContaining(element: Element): IActivitySheetLike | undefined {
  for (const app of foundry.applications.instances.values()) {
    const candidate = app as IActivitySheetLike;
    if (candidate.element?.contains(element)) return candidate;
  }
  return undefined;
}

export function onBehaviorConfigureClick(event: Event): void {
  const target = event.target as Element | null;
  const button = target?.closest?.(`.${BEHAVIOR_CONFIGURE_CLASS}`);
  if (!button) return;
  event.preventDefault();
  event.stopPropagation();
  const behaviorId = button.closest<HTMLElement>("[data-behavior-id]")?.dataset.behaviorId;
  const activity = appContaining(button)?.activity as Parameters<typeof DDBRegionHighlightConfig.openForBehavior>[0] | undefined;
  if (!behaviorId || !activity) {
    logger.warn("RegionHighlight | Configure pressed outside an activity sheet behavior row", { behaviorId });
    return;
  }
  DDBRegionHighlightConfig.openForBehavior(activity, behaviorId);
}

let delegateInstalled = false;

/** Register the delegated Configure handler once per page. */
export function installBehaviorConfigureDelegate(root: Document = document): void {
  if (delegateInstalled) return;
  delegateInstalled = true;
  root.addEventListener("click", onBehaviorConfigureClick);
}
