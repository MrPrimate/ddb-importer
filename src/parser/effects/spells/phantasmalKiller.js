import { baseSpellEffect } from "../specialSpells.js";

export function phantasmalKillerEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push({
    key: "flags.midi-qol.OverTime",
    mode: CONST.ACTIVE_EFFECT_MODES.ADD,
    value:
      "label=Phantasmal Killer,turn=start,saveAbility=wis,saveDC=@attributes.spelldc,saveMagic=true,damageRoll=(@item.level)d10,damageType=psychic,savingThrow=true,damageBeforeSave=false",
    priority: "20",
  });
  document.effects.push(effect);

  return document;
}
