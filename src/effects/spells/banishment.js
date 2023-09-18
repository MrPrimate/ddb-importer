import { baseSpellEffect } from "../specialSpells.js";
import { loadMacroFile, generateMacroChange, generateItemMacroFlag } from "../macros.js";

export async function banishmentEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  const itemMacroText = await loadMacroFile("spell", "banishment.js");
  document = generateItemMacroFlag(document, itemMacroText);
  effect.changes.push(generateMacroChange("", { priority: 0 }));
  document.effects.push(effect);

  return document;
}
