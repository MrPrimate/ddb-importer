import { baseSpellEffect } from "../specialSpells.js";
import DDBMacros from "../macros.js";

export async function blindnessDeafnessEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push({
    key: "flags.midi-qol.OverTime",
    mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
    value: "label=Blindness/Deafness (End of Turn),turn=end,saveDC=@attributes.spelldc,saveAbility=con,savingThrow=true,saveMagic=true,killAnim=true",
    priority: "20",
  });
  await DDBMacros.setItemMacroFlag(document, "spell", "blindnessDeafness.js");
  effect.changes.push(DDBMacros.generateMacroChange({ macroType: "spell", macroName: "blindnessDeafness.js" }));
  document.effects.push(effect);

  return document;
}
