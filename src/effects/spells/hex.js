import { baseSpellEffect } from "../specialSpells.js";
import { loadMacroFile, generateMacroFlags } from "../macros.js";

// this one is a bit different, the macro is triggered by midi-qol and applies effects to the actor
// the Marked effect gets applied to the target
export async function hexEffect(document) {
  let effect = baseSpellEffect(document, "Marked");

  // MACRO START
  const itemMacroText = await loadMacroFile("spell", "hex.js");
  // MACRO STOP

  setProperty(document, "flags.itemacro", generateMacroFlags(document, itemMacroText));
  setProperty(document, "flags.midi-qol.onUseMacroName", "[postActiveEffects]ItemMacro");
  setProperty(document, "data.actionType", "util");

  document.effects.push(effect);

  return document;
}
