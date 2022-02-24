import { baseSpellEffect, generateStatusEffectChange } from "../specialSpells.js";

export function crownofMadnessEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push(generateStatusEffectChange("Charmed"));
  effect.changes.push({
    key: "flags.midi-qol.OverTime",
    mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
    value: "label=Crown of Madness,turn=end,saveDC=@attributes.spelldc,saveAbility=wis,saveMagic=true",
    priority: "20",
  });
  document.effects.push(effect);

  return document;
}
