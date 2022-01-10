import { baseSpellEffect, generateStatusEffectChange } from "../specialSpells.js";
import { loadMacroFile, generateMacroChange, generateMacroFlags } from "../macros.js";

export async function fleshtoStoneEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push(generateStatusEffectChange("Restrained"));
  // MACRO START
  const itemMacroText = await loadMacroFile("spell", "fleshtoStone.js");
  // MACRO STOP
  document.flags["itemacro"] = generateMacroFlags(document, itemMacroText);
  effect.flags.dae.macroRepeat = "endEveryTurn";
  effect.changes.push(generateMacroChange(""));
  document.effects.push(effect);

  return document;
}
