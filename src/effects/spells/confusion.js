import { baseSpellEffect } from "../specialSpells.js";
import DDBMacros from "../macros.js";

export async function confusionEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push({
    key: "flags.midi-qol.OverTime",
    mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
    value: "label=Confusion (End of Turn),turn=end,saveAbility=wis,saveDC=@attributes.spelldc,saveMagic=true,killAnim=true",
    priority: "20",
  });
  effect.flags.dae.macroRepeat = "startEveryTurn";
  const itemMacroText = await DDBMacros.loadMacroFile("spell", "confusion.js");
  document = DDBMacros.generateItemMacroFlag(document, itemMacroText);
  effect.changes.push(DDBMacros.generateMacroChange(""));
  document.effects.push(effect);

  return document;
}
