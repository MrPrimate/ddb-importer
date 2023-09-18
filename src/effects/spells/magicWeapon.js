import { baseSpellEffect } from "../specialSpells.js";
import { loadMacroFile, generateMacroChange, generateItemMacroFlag } from "../macros.js";

export async function magicWeaponEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  const itemMacroText = await loadMacroFile("spell", "magicWeapon.js");
  document = generateItemMacroFlag(document, itemMacroText);
  effect.changes.push(generateMacroChange("@item.level", { priority: 0 }));
  document.effects.push(effect);

  return document;
}
