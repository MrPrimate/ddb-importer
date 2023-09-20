import { baseSpellEffect, generateStatusEffectChange } from "../specialSpells.js";
import DDBMacros from "../macros.js";

export async function contagionEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.flags.dae.macroRepeat = "endEveryTurn";
  effect.changes.push(generateStatusEffectChange("Poisoned"));
  const itemMacroText = await DDBMacros.loadMacroFile("spell", "contagion.js");
  document = DDBMacros.generateItemMacroFlag(document, itemMacroText);
  effect.changes.push(DDBMacros.generateMacroChange({ macroType: "spell", macroName: "contagion.js" }));
  document.effects.push(effect);

  return document;
}
