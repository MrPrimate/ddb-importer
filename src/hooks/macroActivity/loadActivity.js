import MacroActivity from "./macroActivity.js";


export default function addActivitiesHooks() {
  CONFIG.DND5E.activityTypes["macro"] = {
    name: "Macro",
    documentClass: MacroActivity,
  };
}
