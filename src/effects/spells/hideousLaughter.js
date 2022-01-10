import { baseSpellEffect, generateStatusEffectChange } from "../specialSpells.js";
import { loadMacroFile, generateMacroChange, generateMacroFlags } from "../macros.js";

export async function hideousLaughterEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push(
    generateStatusEffectChange("Incapacitated"),
    generateStatusEffectChange("Prone"),
  );

  effect.changes.push({
    key: "flags.midi-qol.OverTime",
    mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
    value: "label=Hideous Laughter,turn=end,saveDc=@attributes.spelldc,saveAbility=wis,saveMagic=true",
    priority: "20",
  });

  // MACRO START
  const itemMacroText = await loadMacroFile("spell", "hideousLaughter.js");
  // MACRO STOP

  document.flags["itemacro"] = generateMacroFlags(document, itemMacroText);
  effect.changes.push(generateMacroChange(""));
  document.effects.push(effect);

  return document;
}
