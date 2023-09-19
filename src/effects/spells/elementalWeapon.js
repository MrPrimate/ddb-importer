import { baseSpellEffect } from "../specialSpells.js";
import DDBMacros from "../macros.js";

export async function elementalWeaponEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  const itemMacroText = await DDBMacros.loadMacroFile("spell", "elementalWeapon.js");
  document = DDBMacros.generateItemMacroFlag(document, itemMacroText);
  effect.changes.push(DDBMacros.generateMacroChange("@item.level", { priority: 0 }));
  document.effects.push(effect);

  document.system.damage.parts = [];
  document.system.actionType = "other";
  document.system.chatFlavor = "";

  return document;
}
