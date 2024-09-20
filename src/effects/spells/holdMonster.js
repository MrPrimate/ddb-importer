import { effectModules } from "../effects.js";

export function holdMonsterEffect(document) {

  if (effectModules().midiQolInstalled) {
    document.effects[0].changes.push({
      key: "flags.midi-qol.OverTime",
      mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
      value: `label=${document.name} (End of Turn),turn=end,saveDC=@attributes.spelldc,saveAbility=wis,savingThrow=true,saveMagic=true,killAnim=true`,
      priority: "20",
    });
  }

  return document;
}
