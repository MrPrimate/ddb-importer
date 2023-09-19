import { baseSpellEffect } from "../specialSpells.js";
import DDBMacros from "../macros.js";

export async function mistyStepEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  const itemMacroText = await DDBMacros.loadMacroFile("spell", "mistyStep.js");
  document = DDBMacros.generateItemMacroFlag(document, itemMacroText);
  effect.changes.push(DDBMacros.generateMacroChange("@target"));
  document.effects.push(effect);

  return document;
}
