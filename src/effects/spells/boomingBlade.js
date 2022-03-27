import { baseSpellEffect } from "../specialSpells.js";
import { loadMacroFile, generateMacroChange, generateItemMacroFlag } from "../macros.js";

export async function boomingBladeEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  const itemMacroText = await loadMacroFile("spell", "boomingBlade.js");
  setProperty(document, "flags.itemacro", generateItemMacroFlag(document, itemMacroText));
  effect.changes.push(generateMacroChange(""));
  setProperty(effect, "duration.turns", 1);
  setProperty(effect, "flags.dae.specialDuration", ["turnStartSource", "isMoved"]);
  document.data.damage = { parts: [], versatile: "", value: "" };
  document.effects.push(effect);
  return document;
}
