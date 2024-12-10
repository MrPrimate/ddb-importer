import { baseSpellEffect } from "../specialSpells.js";
import { DDBMacros } from "../../lib/_module.mjs";
import { addStatusEffectChange, effectModules } from "../effects.js";

export async function fleshtoStoneEffect(document) {
  document.effects = [];
  let effect = baseSpellEffect(document, document.name);
  addStatusEffectChange({ effect, statusName: "Restrained" });

  if (effectModules().midiQolInstalled) {
    await DDBMacros.setItemMacroFlag(document, "spell", "fleshtoStone.js");
    effect.flags.dae.macroRepeat = "endEveryTurn";
    effect.changes.push(DDBMacros.generateMacroChange({ macroType: "spell", macroName: "fleshtoStone.js" }));
  }
  document.effects.push(effect);

  return document;
}
