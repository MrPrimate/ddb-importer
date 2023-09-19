import DDBMacros from "../macros.js";
import { checkJB2a } from "../helpers.js";
import { effectModules } from "../effects.js";

export async function dancingLightsEffect(document) {
  if (!effectModules().warpgateInstalled) return document;
  if (!checkJB2a(true, true, false)) return document;
  // await createJB2aActors("Dancing Lights", "Dancing light");

  const itemMacroText = await DDBMacros.loadMacroFile("spell", "dancingLights.js");
  document = DDBMacros.generateItemMacroFlag(document, itemMacroText);
  DDBMacros.setMidiOnUseMacroFlag(document, "spell", "dancingLights.js", ["postActiveEffects"]);
  return document;

}
