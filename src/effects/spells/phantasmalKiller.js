import { addStatusEffectChange, effectModules } from "../effects.js";
import { baseSpellEffect } from "../specialSpells.js";

export async function phantasmalKillerEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  addStatusEffectChange(effect, "Frightened", 20, true);
  if (effectModules().midiQolInstalled) {
    effect.changes.push({
      key: "flags.midi-qol.OverTime",
      mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
      value:
        "label=Phantasmal Killer (End of Turn),turn=end,saveAbility=wis,saveDC=@attributes.spelldc,saveMagic=true,damageRoll=(@item.level)d10,damageType=psychic,savingThrow=true,damageBeforeSave=false,killAnim=true",
      priority: "20",
    });
    document.system.damage = { parts: [], versatile: "", value: "" };
  }

  document.effects.push(effect);

  return document;
}
