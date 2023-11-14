import { baseSpellEffect } from "../specialSpells.js";
import DDBMacros from "../DDBMacros.js";

export async function banishmentEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  await DDBMacros.setItemMacroFlag(document, "spell", "banishment.js");
  effect.changes.push(DDBMacros.generateMacroChange({ macroValues: "@token", macroType: "spell", macroName: "banishment.js", priority: 0 }));
  document.effects.push(effect);

  return document;
}
