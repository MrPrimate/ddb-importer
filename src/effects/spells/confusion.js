import { baseSpellEffect } from "../specialSpells.js";
import DDBMacros from "../DDBMacros.js";

export async function confusionEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push({
    key: "flags.midi-qol.OverTime",
    mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
    value: "label=Confusion (End of Turn),turn=end,saveAbility=wis,saveDC=@attributes.spelldc,saveMagic=true,killAnim=true",
    priority: "20",
  });
  effect.flags.dae.macroRepeat = "startEveryTurn";
  await DDBMacros.setItemMacroFlag(document, "spell", "confusion.js");
  effect.changes.push(DDBMacros.generateMacroChange({ macroType: "spell", macroName: "confusion.js" }));
  document.effects.push(effect);

  return document;
}
