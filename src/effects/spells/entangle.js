import { addStatusEffectChange } from "../effects.js";
import { baseSpellEffect } from "../specialSpells.js";

export function entangleEffect(document) {
  let effect = baseSpellEffect(document, `${document.name} - Restrained`);
  addStatusEffectChange(effect, "Restrained", 20, true);

  // not implemented as the target can choose to escape with it's action
  // effect.changes.push(
  //   {
  //     key: "flags.midi-qol.OverTime",
  //     mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
  //     value:
  //       `label=${document.name} (Start of Turn),turn=start, saveAbility=str, saveDC=@attributes.spelldc, rollType=save, saveMagic=true, saveRemove=true`,
  //     priority: "20",
  //   },
  // );
  document.effects.push(effect);

  return document;
}
