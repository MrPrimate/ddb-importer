import { baseSpellEffect } from "../specialSpells.js";
import { loadMacroFile, generateMacroChange, generateItemMacroFlag } from "../macros.js";

export async function elementalWeaponEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  const itemMacroText = await loadMacroFile("spell", "elementalWeapon.js");
  document.flags["itemacro"] = generateItemMacroFlag(document, itemMacroText);
  effect.changes.push(generateMacroChange("@item.level", 0));
  document.effects.push(effect);

  document.system.damage.parts = [];
  document.system.actionType = "other";
  document.system.chatFlavor = "";

  return document;
}
