import { effectModules } from "../effects.js";

export function crownofMadnessEffect(document) {

  if (effectModules().midiQolInstalled) {
    document.effect[0].changes.push({
      key: "flags.midi-qol.OverTime",
      mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
      value: "label=Crown of Madness (End of Turn),turn=end,saveDC=@attributes.spelldc,saveAbility=wis,saveMagic=true,killAnim=true",
      priority: "20",
    });
  }

  return document;
}
