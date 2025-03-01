import { effectModules } from "../effects.js";

export async function phantasmalKillerEffect(document) {
  if (effectModules().midiQolInstalled) {
    document.effects[0].changes.push({
      key: "flags.midi-qol.OverTime",
      mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
      value:
        "label=Phantasmal Killer (End of Turn),turn=end,saveAbility=wis,saveDC=@attributes.spell.dc,saveMagic=true,damageRoll=(@item.level)d10,damageType=psychic,savingThrow=true,damageBeforeSave=false,killAnim=true",
      priority: "20",
    });
    document.system.damage = { parts: [], versatile: "", value: "" };
  }

  return document;
}
