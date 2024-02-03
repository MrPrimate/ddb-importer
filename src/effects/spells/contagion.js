import { baseSpellEffect } from "../specialSpells.js";
import DDBMacros from "../DDBMacros.js";
import { addStatusEffectChange, effectModules } from "../effects.js";

export async function contagionEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  addStatusEffectChange(effect, "Poisoned", 20, true);

  if (effectModules().midiQolInstalled) {
    effect.flags.dae.macroRepeat = "endEveryTurn";
    await DDBMacros.setItemMacroFlag(document, "spell", "contagion.js");
    effect.changes.push(DDBMacros.generateMacroChange({ macroType: "spell", macroName: "contagion.js" }));
  }
  document.effects.push(effect);

  return document;
}
