import { baseItemEffect } from "../effects.js";

export function darkOnesOwnLuckffect(document) {
  document.system.damage.parts = [];
  let effect = baseItemEffect(document, document.name, { transfer: true });
  effect.changes.push(
    {
      key: "flags.midi-qol.optional.darkOnesOwnLuck.check.all",
      mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
      value: "+1d10",
      priority: 20,
    },
    {
      key: "flags.midi-qol.optional.darkOnesOwnLuck.save.all",
      mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
      value: "+1d10",
      priority: 20,
    },
    {
      key: "flags.midi-qol.optional.darkOnesOwnLuck.label",
      mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
      value: "Dark One's Own Luck",
      priority: 20,
    },
    {
      key: "flags.midi-qol.optional.darkOnesOwnLuck.count",
      mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
      value: `ItemUses.${document.name}`,
      priority: 20,
    },
    {
      key: "flags.midi-qol.optional.darkOnesOwnLuck.skill.all",
      mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
      value: "+1d10",
      priority: 20,
    },
  );

  return document;
}
