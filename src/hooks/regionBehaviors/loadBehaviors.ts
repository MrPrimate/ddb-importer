import DDBMacroActivityBehavior from "./DDBMacroActivityBehavior";
import DDBDisplayActivityBehavior from "./DDBDisplayActivityBehavior";
import OwnerTurnRegions from "../../effects/auras/OwnerTurnRegions";
import RegionAutomations from "../../effects/auras/RegionAutomations";
import RegionBehaviorSettings from "../../lib/RegionBehaviorSettings";
import RegionDisplayProfiles from "../../lib/RegionDisplayProfiles";
import { REGION_DISPLAY_BEHAVIOR_TYPE, REGION_DISPLAY_I18N } from "../../config/regionDisplayProfiles";

export const DDB_BEHAVIOR_TYPES = {
  macro: "ddbMacro",
  display: REGION_DISPLAY_BEHAVIOR_TYPE,
} as const;

/**
 * Put back the DDB behaviors a sheet save would drop. dnd5e rebuilds an activity's behaviors
 * from its sheet's form, keyed by each behavior's index, and the sheet renders only behaviors
 * whose type is registered. A DDB type goes unregistered while its switch is off (region
 * display profiles, or the region automation master), so without this the next save of the
 * activity sheet deletes those behaviors. They are restored at their own index, which keeps the
 * order; with the switch back on they render and save normally again.
 */
export function restoreSwitchedOffBehaviors(submitData: Record<string, unknown> | null | undefined, sourceBehaviors: { type?: string }[] | undefined): void {
  const submitted = submitData?.behaviors;
  if (!submitted || typeof submitted !== "object" || Array.isArray(submitted)) return;
  const entries = submitted as Record<string, unknown>;
  const ddbTypes = new Set<string>(Object.values(DDB_BEHAVIOR_TYPES));
  (sourceBehaviors ?? []).forEach((behavior, index) => {
    if (String(index) in entries) return;
    if (!behavior?.type || !ddbTypes.has(behavior.type)) return;
    if (behavior.type in CONFIG.DND5E.activityBehaviorTypes) return;
    entries[String(index)] = behavior;
  });
}

function preserveSwitchedOffBehaviors() {
  const prototype = dnd5e.applications?.activity?.ActivitySheet?.prototype as unknown as {
    _prepareSubmitData: (this: { activity?: { toObject(): { behaviors?: { type?: string }[] } } }, ...args: unknown[]) => Record<string, unknown>;
  } | undefined;
  const prepareSubmitData = prototype?._prepareSubmitData;
  if (!prototype || !prepareSubmitData) return;
  prototype._prepareSubmitData = function (...args: unknown[]) {
    const submitData = prepareSubmitData.apply(this, args);
    restoreSwitchedOffBehaviors(submitData, this.activity?.toObject().behaviors);
    return submitData;
  };
}

export default function addRegionBehaviorHooks() {
  preserveSwitchedOffBehaviors();
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
  RegionAutomations.registerHooks();
  CONFIG.DND5E.activityBehaviorTypes[DDB_BEHAVIOR_TYPES.macro] = {
    label: "ddb-importer.behaviors.macro.Label",
    icon: "icons/svg/dice-target.svg",
    model: DDBMacroActivityBehavior,
  };
}
