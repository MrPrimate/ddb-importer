import { baseSpellEffect } from "../specialSpells.js";
import DDBMacros from "../macros.js";

export async function banishmentEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  const itemMacroText = await DDBMacros.loadMacroFile("spell", "banishment.js");
  document = DDBMacros.generateItemMacroFlag(document, itemMacroText);
  effect.changes.push(DDBMacros.generateMacroChange({ macroValues: "@token", macroType: "spell", macroName: "banishment.js", priority: 0 }));
  document.effects.push(effect);

  return document;
}
