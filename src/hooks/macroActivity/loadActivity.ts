import MacroActivity from "./MacroActivity";


export default function addActivitiesHooks() {
  CONFIG.DND5E.activityTypes["ddbmacro"] = {
    // hidden: true,
    documentClass: MacroActivity,
  };
}
