import DDBMacroActivityBehavior from "./DDBMacroActivityBehavior";

export const DDB_BEHAVIOR_TYPES = {
  macro: "ddbMacro",
} as const;

export default function addRegionBehaviorHooks() {
  CONFIG.DND5E.activityBehaviorTypes[DDB_BEHAVIOR_TYPES.macro] = {
    label: "ddb-importer.behaviors.macro.Label",
    icon: "icons/svg/dice-target.svg",
    model: DDBMacroActivityBehavior,
  };
}
