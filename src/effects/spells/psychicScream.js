import { effectModules } from "../effects.js";

export function psychicScreamEffect(document) {

  if (effectModules().midiQolInstalled) {
    document.effects[0].changes.push(
      {
        key: "flags.midi-qol.OverTime",
        mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
        value: "label=Psychic Scream Stun (End of Turn),turn=end,saveDC=@attributes.spelldc,saveAbility=int,saveMagic=true,killAnim=true",
        priority: "20",
      },
    );
    document.effects[0].duration.rounds = 99;
    foundry.utils.setProperty(document, "flags.midiProperties.halfdam", true);
    foundry.utils.setProperty(document, "flags.midiProperties.saveDamage", "halfdam");
  }

  return document;
}
