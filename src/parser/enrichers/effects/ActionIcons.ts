import { DICTIONARY } from "../../../config/_module";
import SystemHelpers from "../../lib/SystemHelpers";

/**
 * dnd5e's action icons (systems/dnd5e/icons/svg/action) for activities named after a basic action,
 * as the SRD's own items use them. An icon the running dnd5e does not ship is never set: dnd5e 6.0
 * has only the Dash icon.
 */
export default class ActionIcons {

  /** The action icon for an activity name, or null when there is none for the running dnd5e. */
  static iconFor(name: string | null | undefined): string | null {
    const trimmed = name?.trim();
    if (!trimmed) return null;
    const entry = DICTIONARY.actions.basicActionIcons.find((icon) => icon.name === trimmed);
    if (!entry) return null;
    if (entry.since && !SystemHelpers.dnd5eAtLeast(entry.since)) return null;
    return entry.path;
  }

  /** Give each activity without an image of its own the action icon its name matches. */
  static apply(document: TAll5eItemDocuments): void {
    const activities = document.system && "activities" in document.system
      ? Object.values(document.system.activities ?? {}) as { name?: string | null; img?: string | null }[]
      : [];
    for (const activity of activities) {
      if (activity.img) continue;
      const icon = ActionIcons.iconFor(activity.name);
      if (icon) activity.img = icon;
    }
  }

}
