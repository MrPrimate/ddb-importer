import { baseSpellEffect } from "../specialSpells.js";
import DDBMacros from "../DDBMacros.js";

export async function magicWeaponEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  await DDBMacros.setItemMacroFlag(document, "spell", "magicWeapon.js");
  effect.changes.push(DDBMacros.generateMacroChange({ macroValues: "@item.level", macroType: "spell", macroName: "magicWeapon.js", priority: 0 }));
  document.effects.push(effect);

  return document;
}
