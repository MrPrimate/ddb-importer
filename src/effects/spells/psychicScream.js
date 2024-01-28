import { baseSpellEffect, generateStatusEffectChange } from "../specialSpells.js";

export function psychicScreamEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push(generateStatusEffectChange("Stunned", 20, true));
  effect.changes.push(
    {
      key: "flags.midi-qol.OverTime",
      mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
      value: "label=Psychic Scream Stun (End of Turn),turn=end,saveDC=@attributes.spelldc,saveAbility=int,saveMagic=true,killAnim=true",
      priority: "20",
    },
  );
  effect.duration.rounds = 99;
  setProperty(document, "flags.midiProperties.halfdam", true);
  setProperty(document, "flags.midiProperties.saveDamage", "halfdam");
  document.effects.push(effect);

  return document;
}
