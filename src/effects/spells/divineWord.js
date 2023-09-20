import { baseSpellEffect } from "../specialSpells.js";
import DDBMacros from "../macros.js";

export async function divineWordEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  const itemMacroText = await DDBMacros.loadMacroFile("spell", "divineWord.js");
  document = DDBMacros.generateItemMacroFlag(document, itemMacroText);
  effect.changes.push(DDBMacros.generateMacroChange({ macroType: "spell", macroName: "divineWord.js" }));
  document.effects.push(effect);

  return document;
}
