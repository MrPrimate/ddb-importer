import { effectModules } from "../effects.js";
import { baseFeatEffect } from "../specialFeats.js";

export function heavyArmorMasterEffect(document) {
  let effect = baseFeatEffect(document, `${document.name}`, { transfer: true });
  if (effectModules.midiQolInstalled) {
    effect.changes.push(
      {
        key: "flags.midi-qol.DR.non-magical",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        value: "3",
        priority: "20",
      },
    );
  } else {
    effect.changes.push(
      {
        key: "system.traits.dm",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        value: "3",
        priority: "20",
      },
    );
  }

  document.effects.push(effect);
  return document;
}
