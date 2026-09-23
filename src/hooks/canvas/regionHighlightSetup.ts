import DDBRegionHighlightProfiles from "../../apps/DDBRegionHighlightProfiles";
import logger from "../../lib/Logger";
import RegionHighlightProfiles from "../../lib/RegionHighlightProfiles";
import { registerRegionConfigHighlight } from "./regionConfigHighlight";
import { installBehaviorConfigureDelegate } from "./regionHighlightBehaviorConfigure";
import { registerRegionHighlightHooks } from "./regionHighlight";
import { installProfilePickerDelegate } from "./regionHighlightPicker";
import { registerRegionHighlightStamp } from "./regionHighlightStamp";

/**
 * Wire the region highlight profiles: canvas rendering, placement stamping, the Region config
 * box, the picker gear, the behavior Configure button and picker refresh. Runs at init, after the early settings are
 * registered, so the master switch can turn the whole feature off before any hook exists.
 */
export function setupRegionHighlightProfiles(): boolean {
  if (!RegionHighlightProfiles.enabled) {
    logger.info("Region highlight profiles are disabled; regions keep Foundry's own highlight");
    return false;
  }
  registerRegionHighlightHooks();
  registerRegionHighlightStamp();
  registerRegionConfigHighlight();
  installProfilePickerDelegate();
  installBehaviorConfigureDelegate();
  DDBRegionHighlightProfiles.registerPickerRefresh();
  return true;
}
