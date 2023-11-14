import { baseSpellEffect } from "../specialSpells.js";
import DDBMacros from "../DDBMacros.js";

export async function elementalWeaponEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  await DDBMacros.setItemMacroFlag(document, "spell", "elementalWeapon.js");
  effect.changes.push(DDBMacros.generateMacroChange({ macroValues: "@item.level", macroType: "spell", macroName: "elementalWeapon.js", priority: 0 }));
  document.effects.push(effect);

  document.system.damage.parts = [];
  document.system.actionType = "other";
  document.system.chatFlavor = "";

  return document;
}
