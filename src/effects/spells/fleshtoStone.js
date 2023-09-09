import { baseSpellEffect, generateStatusEffectChange } from "../specialSpells.js";
import { loadMacroFile, generateMacroChange, generateItemMacroFlag } from "../macros.js";

export async function fleshtoStoneEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push(generateStatusEffectChange("Restrained"));
  const itemMacroText = await loadMacroFile("spell", "fleshtoStone.js");
  document = generateItemMacroFlag(document, itemMacroText);
  effect.flags.dae.macroRepeat = "endEveryTurn";
  effect.changes.push(generateMacroChange(""));
  document.effects.push(effect);

  return document;
}
