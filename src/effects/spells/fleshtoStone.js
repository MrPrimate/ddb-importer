import { baseSpellEffect, generateStatusEffectChange } from "../specialSpells.js";
import DDBMacros from "../macros.js";

export async function fleshtoStoneEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push(generateStatusEffectChange("Restrained"));
  const itemMacroText = await DDBMacros.loadMacroFile("spell", "fleshtoStone.js");
  document = DDBMacros.generateItemMacroFlag(document, itemMacroText);
  effect.flags.dae.macroRepeat = "endEveryTurn";
  effect.changes.push(DDBMacros.generateMacroChange({ macroType: "spell", macroName: "fleshtoStone.js" }));
  document.effects.push(effect);

  return document;
}
