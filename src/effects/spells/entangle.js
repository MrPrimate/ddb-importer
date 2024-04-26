import { addStatusEffectChange } from "../effects.js";
import { baseSpellEffect } from "../specialSpells.js";

export function entangleEffect(document) {
  let effect = baseSpellEffect(document, `${document.name} - Restrained`);
  addStatusEffectChange(effect, "Restrained", 20, true);

  effect.changes.push(
    {
      key: "flags.midi-qol.OverTime",
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      value: "You can take an action to break free by rolling a Strength Ability Check",
      priority: "20",
    },
    {
      key: "flags.midi-qol.OverTime",
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      value: `turn=end, rollType=check, actionSave=true, saveAbility=str, saveDC=@attributes.spelldc, label=Restrained by ${document.name}`,
      priority: "20",
    },
  );

  foundry.utils.setProperty(effect, "duration.seconds", 60);
  foundry.utils.setProperty(effect, "duration.rounds", 10);
  foundry.utils.setProperty(effect, "flags.dae.stackable", "noneName");

  document.effects.push(effect);

  return document;
}
