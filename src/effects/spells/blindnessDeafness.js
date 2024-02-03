import { baseSpellEffect } from "../specialSpells.js";
import DDBMacros from "../DDBMacros.js";
import { addStatusEffectChange, effectModules } from "../effects.js";

export async function blindnessDeafnessEffect(document) {
  if (effectModules().midiQolInstalled) {
    let effect = baseSpellEffect(document, document.name);
    effect.changes.push({
      key: "flags.midi-qol.OverTime",
      mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
      value: "label=Blindness/Deafness (End of Turn),turn=end,saveDC=@attributes.spelldc,saveAbility=con,savingThrow=true,saveMagic=true,killAnim=true",
      priority: "20",
    });
    effect.duration.rounds = 10;
    effect.duration.seconds = 60;
    await DDBMacros.setItemMacroFlag(document, "spell", "blindnessDeafness.js");
    effect.changes.push(DDBMacros.generateMacroChange({ macroType: "spell", macroName: "blindnessDeafness.js" }));
    DDBMacros.setMidiOnUseMacroFlag(document, "spell", "blindnessDeafness.js", ["postActiveEffects"]);
    document.effects.push(effect);
  } else {
    let blindnessEffect = baseSpellEffect(document, "Blindness");
    addStatusEffectChange(blindnessEffect, "Blinded", 20, true);
    document.effects.push(blindnessEffect);
    let deafenedEffect = baseSpellEffect(document, "Deafness");
    addStatusEffectChange(deafenedEffect, "Deafened", 20, true);
    document.effects.push(deafenedEffect);
  }


  return document;
}
