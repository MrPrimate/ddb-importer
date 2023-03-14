import { baseSpellEffect } from "../specialSpells.js";
import { loadMacroFile, generateMacroChange, generateItemMacroFlag } from "../macros.js";

export async function confusionEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push({
    key: "flags.midi-qol.OverTime",
    mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
    value: "label=Confusion (End of Turn),turn=end,saveAbility=wis,saveDC=@attributes.spelldc,saveMagic=true,killAnim=true",
    priority: "20",
  });
  effect.flags.dae.macroRepeat = "startEveryTurn";
  const itemMacroText = await loadMacroFile("spell", "confusion.js");
  document.flags["itemacro"] = generateItemMacroFlag(document, itemMacroText);
  effect.changes.push(generateMacroChange(""));
  document.effects.push(effect);

  return document;
}
