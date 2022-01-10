import { baseSpellEffect } from "../specialSpells.js";
import { loadMacroFile, generateMacroChange, generateMacroFlags } from "../macros.js";

export async function confusionEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push({
    key: "flags.midi-qol.OverTime",
    mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
    value: "label=Confusion,turn=end,saveAbility=wis,saveDC=@attributes.spelldc,saveMagic=true",
    priority: "20",
  });
  effect.flags.dae.macroRepeat = "startEveryTurn";
  // MACRO START
  const itemMacroText = await loadMacroFile("spell", "confusion.js");
  // MACRO STOP
  document.flags["itemacro"] = generateMacroFlags(document, itemMacroText);
  effect.changes.push(generateMacroChange(""));
  document.effects.push(effect);

  return document;
}
