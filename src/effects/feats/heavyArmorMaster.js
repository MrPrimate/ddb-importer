import { effectModules } from "../effects.js";
import { baseFeatEffect } from "../specialFeats.js";

export function heavyArmorMasterEffect(document) {
  let effect = baseFeatEffect(document, `${document.name}`, { transfer: true });
  if (effectModules().midiQolInstalled) {
    effect.changes.push(
      {
        key: "flags.midi-qol.DR.non-magical",
        mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
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
      {
        key: "system.traits.dm.bypasses",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        value: "mgc",
        priority: "20",
      },
    );
  }

  document.effects.push(effect);
  return document;
}
