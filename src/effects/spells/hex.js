import { baseSpellEffect } from "../specialSpells.js";
import { loadMacroFile, generateItemMacroFlag, setMidiOnUseMacroFlag } from "../macros.js";

// this one is a bit different, the macro is triggered by midi-qol and applies effects to the actor
// the Marked effect gets applied to the target
export async function hexEffect(document) {
  let effect = baseSpellEffect(document, "Marked");

  const itemMacroText = await loadMacroFile("spell", "hex.js");
  document = generateItemMacroFlag(document, itemMacroText);
  setMidiOnUseMacroFlag(document, "spell", "hex.js", ["postActiveEffects"]);
  setProperty(document, "system.actionType", "util");

  document.effects.push(effect);
  return document;
}
