import { loadMacroFile, generateItemMacroFlag } from "../macros.js";

export async function mantleOfInspirationEffect(document) {
  const itemMacroText = await loadMacroFile("feat", "mantleOfInspiration.js");
  document = generateItemMacroFlag(document, itemMacroText);
  setProperty(document, "flags.midi-qol.onUseMacroName", "[preTargeting]ItemMacro");

  return document;
}
