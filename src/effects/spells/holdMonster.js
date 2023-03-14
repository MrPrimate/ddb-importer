import { baseSpellEffect, generateStatusEffectChange } from "../specialSpells.js";

export function holdMonsterEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push(generateStatusEffectChange("Paralyzed"));
  effect.changes.push({
    key: "flags.midi-qol.OverTime",
    mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
    value: `label=${document.name} (End of Turn),turn=end,saveDC=@attributes.spelldc,saveAbility=wis,savingThrow=true,saveMagic=true,killAnim=true`,
    priority: "20",
  });
  document.effects.push(effect);

  return document;
}
