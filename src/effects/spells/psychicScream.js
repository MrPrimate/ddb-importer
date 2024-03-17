import { addStatusEffectChange, effectModules } from "../effects.js";
import { baseSpellEffect } from "../specialSpells.js";

export function psychicScreamEffect(document) {
  let effect = baseSpellEffect(document, `${document.name} - Stunned`);
  addStatusEffectChange(effect, "Stunned", 20, true);

  if (effectModules().midiQolInstalled) {
    effect.changes.push(
      {
        key: "flags.midi-qol.OverTime",
        mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
        value: "label=Psychic Scream Stun (End of Turn),turn=end,saveDC=@attributes.spelldc,saveAbility=int,saveMagic=true,killAnim=true",
        priority: "20",
      },
    );
    effect.duration.rounds = 99;
    foundry.utils.setProperty(document, "flags.midiProperties.halfdam", true);
    foundry.utils.setProperty(document, "flags.midiProperties.saveDamage", "halfdam");
  }
  document.effects.push(effect);

  return document;
}
