import { baseSpellEffect } from "../specialSpells.js";
import DDBMacros from "../DDBMacros.js";
import { addStatusEffectChange } from "../effects.js";

export async function contagionEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.flags.dae.macroRepeat = "endEveryTurn";
  addStatusEffectChange(effect, "Poisoned", 20, true);
  await DDBMacros.setItemMacroFlag(document, "spell", "contagion.js");
  effect.changes.push(DDBMacros.generateMacroChange({ macroType: "spell", macroName: "contagion.js" }));
  document.effects.push(effect);

  return document;
}
