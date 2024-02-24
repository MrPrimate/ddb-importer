import { effectModules } from "../effects.js";
import { baseFeatEffect } from "../specialFeats.js";

export function heavyArmorMasterEffect(document) {
  let effect = baseFeatEffect(document, `${document.name}`, { transfer: true });
  console.warn("heavyArmorMasterEffect", {
    effect,
    midi: effectModules().midiQolInstalled,
    effectModules,
  });
  if (effectModules().midiQolInstalled) {
    console.warn("here")
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
        key: "system.traits.dm.amount.bludgeoning",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        value: "-3",
        priority: "20",
      },
      {
        key: "system.traits.dm.amount.slashing",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        value: "-3",
        priority: "20",
      },
      {
        key: "system.traits.dm.amount.piercing",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        value: "-3",
        priority: "20",
      },
    );
  }

  document.effects.push(effect);
  return document;
}
