import { baseSpellEffect, generateStatusEffectChange } from "../specialSpells.js";
import DDBMacros from "../macros.js";

export async function fleshtoStoneEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push(generateStatusEffectChange("Restrained", 20, true));
  await DDBMacros.setItemMacroFlag(document, "spell", "fleshtoStone.js");
  effect.flags.dae.macroRepeat = "endEveryTurn";
  effect.changes.push(DDBMacros.generateMacroChange({ macroType: "spell", macroName: "fleshtoStone.js" }));
  document.effects.push(effect);

  return document;
}
