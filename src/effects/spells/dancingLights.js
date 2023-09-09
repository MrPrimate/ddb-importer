import { loadMacroFile, generateItemMacroFlag } from "../macros.js";
import { createJB2aActors, checkJB2a } from "../helpers.js";
import { effectModules } from "../effects.js";

export async function dancingLightsEffect(document) {
  if (!effectModules().warpgateInstalled) return document;
  if (!checkJB2a(true, true, false)) return document;
  await createJB2aActors("Dancing Lights", "Dancing light");

  const itemMacroText = await loadMacroFile("spell", "dancingLights.js");
  document = generateItemMacroFlag(document, itemMacroText);
  setProperty(document, "flags.midi-qol.onUseMacroName", "[postActiveEffects]ItemMacro");
  return document;

}
