import { baseSpellEffect, generateStatusEffectChange } from "../specialSpells.js";
import DDBMacros from "../DDBMacros.js";

export async function contagionEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.flags.dae.macroRepeat = "endEveryTurn";
  effect.changes.push(generateStatusEffectChange("Poisoned"));
  await DDBMacros.setItemMacroFlag(document, "spell", "contagion.js");
  effect.changes.push(DDBMacros.generateMacroChange({ macroType: "spell", macroName: "contagion.js" }));
  document.effects.push(effect);

  return document;
}
