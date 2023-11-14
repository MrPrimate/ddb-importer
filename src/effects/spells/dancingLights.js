import DDBMacros from "../DDBMacros.js";
import { effectModules } from "../effects.js";
import DDBEffectHelper from "../DDBEffectHelper.js";

export async function dancingLightsEffect(document) {
  if (!effectModules().warpgateInstalled) return document;
  if (!DDBEffectHelper.checkJB2a(true, true, false)) return document;

  await DDBMacros.setItemMacroFlag(document, "spell", "dancingLights.js");
  DDBMacros.setMidiOnUseMacroFlag(document, "spell", "dancingLights.js", ["postActiveEffects"]);
  return document;

}
