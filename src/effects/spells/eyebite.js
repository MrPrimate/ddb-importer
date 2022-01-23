import { baseSpellEffect } from "../specialSpells.js";
import { loadMacroFile, generateMacroChange, generateItemMacroFlag } from "../macros.js";

export async function eyebiteEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  const itemMacroText = await loadMacroFile("spell", "eyebite.js");
  document.flags["itemacro"] = generateItemMacroFlag(document, itemMacroText);
  effect.flags.dae.macroRepeat = "startEveryTurn";
  effect.changes.push(generateMacroChange(""));
  document.effects.push(effect);
  setProperty(document, "data.actionType", "other");
  setProperty(document, "data.save.ability", "");

  return document;
}
