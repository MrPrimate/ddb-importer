import { baseSpellEffect } from "../specialSpells.js";
import DDBMacros from "../macros.js";

export async function magicWeaponEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  const itemMacroText = await DDBMacros.loadMacroFile("spell", "magicWeapon.js");
  document = DDBMacros.generateItemMacroFlag(document, itemMacroText);
  effect.changes.push(DDBMacros.generateMacroChange({ macroValues: "@item.level", macroType: "spell", macroName: "magicWeapon.js", priority: 0 }));
  document.effects.push(effect);

  return document;
}
