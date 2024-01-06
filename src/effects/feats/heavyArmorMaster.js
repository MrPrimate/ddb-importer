import { baseFeatEffect } from "../specialFeats.js";

export function heavyArmorMasterEffect(document) {
  let effect = baseFeatEffect(document, `${document.name}`, true);
  effect.changes.push(
    {
      key: "flags.midi-qol.DR.non-magical",
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      value: "3",
      priority: "20",
    },
  );
  effect.transfer = true;
  document.effects.push(effect);
  return document;
}
