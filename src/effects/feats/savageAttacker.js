import { baseFeatEffect } from "../specialFeats.js";

export function savageAttackerEffect(document) {
  if (document.system.actionType === null) return document;
  let effect = baseFeatEffect(document, document.name, { transfer: true });

  effect.changes.push(
    {
      key: "flags.midi-qol.optional.savageAttacker.label",
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      value: `${document.name} - Weapon Damage Reroll`,
      priority: "5",
    },
    {
      key: "flags.midi-qol.optional.savageAttacker.count",
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      value: "turn",
      priority: "5",
    },
    {
      key: "flags.midi-qol.optional.savageAttacker.damage.mwak",
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      value: "reroll-kh",
      priority: "5",
    },
  );

  document.effects.push(effect);
  return document;
}
