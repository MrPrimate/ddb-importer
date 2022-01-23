import { baseSpellEffect } from "../specialSpells.js";
import { loadMacroFile, generateMacroChange, generateItemMacroFlag } from "../macros.js";

export async function blindnessDeafnessEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push({
    key: "flags.midi-qol.OverTime",
    mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
    value: "label=Blindness/Deafness,turn=end,saveDC=@attributes.spelldc,saveAbility=con,savingThrow=true,saveMagic=true",
    priority: "20",
  });
  const itemMacroText = await loadMacroFile("spell", "blindnessDeafness.js");
  document.flags["itemacro"] = generateItemMacroFlag(document, itemMacroText);
  effect.changes.push(generateMacroChange(""));
  document.effects.push(effect);

  return document;
}
