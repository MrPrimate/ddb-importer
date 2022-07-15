import { baseSpellEffect } from "../specialSpells.js";
import { loadMacroFile, generateItemMacroFlag } from "../macros.js";

// this one is a bit different, the macro is triggered by midi-qol and applies effects to the actor
// the Marked effect gets applied to the target
export async function huntersMarkEffect(document) {
  let effect = baseSpellEffect(document, "Marked");

  const itemMacroText = await loadMacroFile("spell", "huntersMark.js");

  setProperty(document, "flags.itemacro", generateItemMacroFlag(document, itemMacroText));
  setProperty(document, "flags.midi-qol.onUseMacroName", "[postActiveEffects]ItemMacro");
  setProperty(document, "system.actionType", "util");

  document.effects.push(effect);

  return document;
}
