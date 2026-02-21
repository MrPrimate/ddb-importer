import { baseSpellEffect } from "../specialSpells";
import { DDBMacros } from "../../lib/_module";

export async function divineWordEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  await DDBMacros.setItemMacroFlag(document, "spell", "divineWord.js");
  effect.changes.push(DDBMacros.generateMacroChange({ macroType: "spell", macroName: "divineWord.js" }));
  document.effects.push(effect);

  return document;
}
