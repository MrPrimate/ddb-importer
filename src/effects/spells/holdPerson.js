import { addStatusEffectChange, effectModules } from "../effects.js";
import { baseSpellEffect } from "../specialSpells.js";

export function holdPersonEffect(document) {
  let effect = baseSpellEffect(document, `${document.name} - Paralyzed`);
  addStatusEffectChange(effect, "Paralyzed", 20, true);

  if (effectModules().midiQolInstalled) {
    effect.changes.push({
      key: "flags.midi-qol.OverTime",
      mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
      value: `label=${document.name} (End of Turn),turn=end,saveDC=@attributes.spelldc,saveAbility=wis,savingThrow=true,saveMagic=true,killAnim=true`,
      priority: "20",
    });
  }
  document.effects.push(effect);

  return document;
}
