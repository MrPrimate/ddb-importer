import { baseSpellEffect, generateStatusEffectChange } from "../specialSpells.js";

export function entangleEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push(generateStatusEffectChange("Restrained"));

  // not implemented as the target can choose to escape with it's action
  // effect.changes.push(
  //   {
  //     key: "flags.midi-qol.OverTime",
  //     mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
  //     value:
  //       `label=${document.name} (Start of Turn),turn=start, saveAbility=${document.system.save.ability}, saveDC=@attributes.spelldc, rollType=save, saveMagic=true, saveRemove=true`,
  //     priority: "20",
  //   },
  // );
  document.effects.push(effect);

  return document;
}
