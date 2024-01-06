import { baseFeatEffect } from "../specialFeats.js";

export function deftStrikeEffect(document) {
  let effect = baseFeatEffect(document, document.name, { transfer: true });

  effect.changes.push(
    {
      key: "flags.midi-qol.optional.deftStrike.label",
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      value: `${document.name} Additional Damage`,
      priority: "5",
    },
    {
      key: "flags.midi-qol.optional.deftStrike.count",
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      value: "turn",
      priority: "5",
    },
    {
      key: "flags.midi-qol.optional.deftStrike.damage.all",
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      value: "@scale.monk.martial-arts",
      priority: "5",
    },
    {
      key: "flags.midi-qol.optional.deftStrike.countAlt",
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      value: "ItemUses.Ki Points",
      priority: "5",
    },
    {
      key: "flags.midi-qol.optional.deftStrike.criticalDamage",
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      value: "1",
      priority: "5",
    },
  );

  document.system.damage.parts = [];
  document.system.actionType = null;

  document.effects.push(effect);
  return document;
}
