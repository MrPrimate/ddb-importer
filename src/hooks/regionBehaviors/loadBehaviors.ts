import DDBMacroActivityBehavior from "./DDBMacroActivityBehavior";
import DDBDisplayActivityBehavior from "./DDBDisplayActivityBehavior";
import OwnerTurnRegions from "../../effects/auras/OwnerTurnRegions";
import RegionBehaviorSettings from "../../lib/RegionBehaviorSettings";
import RegionDisplayProfiles from "../../lib/RegionDisplayProfiles";
import { REGION_DISPLAY_BEHAVIOR_TYPE, REGION_DISPLAY_I18N } from "../../config/regionDisplayProfiles";

export const DDB_BEHAVIOR_TYPES = {
  macro: "ddbMacro",
  display: REGION_DISPLAY_BEHAVIOR_TYPE,
} as const;

export default function addRegionBehaviorHooks() {
  // the region display behavior is not automation: it stays available when the automation master
  // switch is off, and goes with its own switch instead
  if (RegionDisplayProfiles.enabled) {
    CONFIG.DND5E.activityBehaviorTypes[DDB_BEHAVIOR_TYPES.display] = {
      label: `${REGION_DISPLAY_I18N}.Label`,
      icon: "icons/svg/circle.svg",
      model: DDBDisplayActivityBehavior,
    };
  }
  if (!RegionBehaviorSettings.enabled) return;
  OwnerTurnRegions.registerHooks();
  CONFIG.DND5E.activityBehaviorTypes[DDB_BEHAVIOR_TYPES.macro] = {
    label: "ddb-importer.behaviors.macro.Label",
    icon: "icons/svg/dice-target.svg",
    model: DDBMacroActivityBehavior,
  };
}
