import DDBRegionDisplayProfiles from "../../apps/DDBRegionDisplayProfiles";
import logger from "../../lib/Logger";
import RegionDisplayProfiles from "../../lib/RegionDisplayProfiles";
import { registerRegionConfigDisplay } from "./regionConfigDisplay";
import { installBehaviorConfigureDelegate } from "./regionDisplayBehaviorConfigure";
import { registerRegionDisplayHooks } from "./regionDisplay";
import { installProfilePickerDelegate } from "./regionDisplayPicker";
import { registerRegionDisplayStamp } from "./regionDisplayStamp";

/**
 * Wire the region display profiles: canvas rendering, placement stamping, the Region config
 * box, the picker gear, the behavior Configure button and picker refresh. Runs at init, after the early settings are
 * registered, so the master switch can turn the whole feature off before any hook exists.
 */
export function setupRegionDisplayProfiles(): boolean {
  if (!RegionDisplayProfiles.enabled) {
    logger.info("Region display profiles are disabled; regions keep Foundry's own highlight");
    return false;
  }
  registerRegionDisplayHooks();
  registerRegionDisplayStamp();
  registerRegionConfigDisplay();
  installProfilePickerDelegate();
  installBehaviorConfigureDelegate();
  DDBRegionDisplayProfiles.registerPickerRefresh();
  return true;
}
