import DDBMacros from "../macros.js";

export async function mantleOfInspirationEffect(document) {
  const itemMacroText = await DDBMacros.loadMacroFile("feat", "mantleOfInspiration.js");
  document = DDBMacros.generateItemMacroFlag(document, itemMacroText);
  DDBMacros.setMidiOnUseMacroFlag(document, "feat", "mantleOfInspiration.js", ["preTargeting"]);

  return document;
}
