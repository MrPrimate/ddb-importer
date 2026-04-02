import { baseSpellEffect } from "../specialSpells";
import { DDBMacros } from "../../lib/_module";

export async function divineWordEffect(document) {
  const effect = baseSpellEffect(document, document.name);
  await DDBMacros.setItemMacroFlag(document, "spell", "divineWord.js");
  effect.system.changes.push(DDBMacros.generateMacroChange({ macroType: "spell", macroName: "divineWord.js" }));
  document.effects.push(effect);

  return document;
}
