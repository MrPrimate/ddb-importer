import { loadMacroFile, generateItemMacroFlag, setMidiOnUseMacroFlag } from "../macros.js";

export async function mantleOfInspirationEffect(document) {
  const itemMacroText = await loadMacroFile("feat", "mantleOfInspiration.js");
  document = generateItemMacroFlag(document, itemMacroText);
  setMidiOnUseMacroFlag(document, "feat", "mantleOfInspiration.js", ["preTargeting"]);

  return document;
}
