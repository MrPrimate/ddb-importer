import { baseSpellEffect } from "../specialSpells.js";
import { loadMacroFile, generateMacroChange, generateMacroFlags } from "../macros.js";

export async function callLightningEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  // MACRO START
  const itemMacroText = await loadMacroFile("spell", "callLightning.js");
  // MACRO STOP
  document.flags["itemacro"] = generateMacroFlags(document, itemMacroText);
  effect.changes.push(generateMacroChange("@spellLevel"));
  document.effects.push(effect);
  setProperty(document, "data.actionType", "other");

  return document;
}
