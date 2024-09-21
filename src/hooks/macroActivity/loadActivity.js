import MacroActivity from "./MacroActivity.js";


export default function addActivitiesHooks() {
  CONFIG.DND5E.activityTypes["ddbmacro"] = {
    // hidden: true,
    documentClass: MacroActivity,
  };
}
