import { baseSpellEffect } from "../specialSpells.js";
import DDBMacros from "../DDBMacros.js";

export async function mistyStepEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  await DDBMacros.setItemMacroFlag(document, "spell", "mistyStep.js");
  effect.changes.push(DDBMacros.generateMacroChange({ macroValues: "@target", macroType: "spell", macroName: "mistyStep.js" }));
  document.effects.push(effect);

  return document;
}
