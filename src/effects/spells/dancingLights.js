import DDBMacros from "../macros.js";
import { checkJB2a } from "../helpers.js";
import { effectModules } from "../effects.js";

export async function dancingLightsEffect(document) {
  if (!effectModules().warpgateInstalled) return document;
  if (!checkJB2a(true, true, false)) return document;
  // await createJB2aActors("Dancing Lights", "Dancing light");

  await DDBMacros.setItemMacroFlag(document, "spell", "dancingLights.js");
  DDBMacros.setMidiOnUseMacroFlag(document, "spell", "dancingLights.js", ["postActiveEffects"]);
  return document;

}
