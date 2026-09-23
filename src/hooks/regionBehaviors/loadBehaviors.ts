import DDBMacroActivityBehavior from "./DDBMacroActivityBehavior";
import DDBHighlightActivityBehavior from "./DDBHighlightActivityBehavior";
import OwnerTurnRegions from "../../effects/auras/OwnerTurnRegions";
import RegionBehaviorSettings from "../../lib/RegionBehaviorSettings";
import RegionHighlightProfiles from "../../lib/RegionHighlightProfiles";

export const DDB_BEHAVIOR_TYPES = {
  macro: "ddbMacro",
  highlight: "ddbHighlight",
} as const;

export default function addRegionBehaviorHooks() {
  // the appearance behavior is not automation: it stays available when the automation master
  // switch is off, and goes with its own switch instead
  if (RegionHighlightProfiles.enabled) {
    CONFIG.DND5E.activityBehaviorTypes[DDB_BEHAVIOR_TYPES.highlight] = {
      label: "ddb-importer.behaviors.highlight.Label",
      icon: "icons/svg/circle.svg",
      model: DDBHighlightActivityBehavior,
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
