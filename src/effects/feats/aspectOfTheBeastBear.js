import { baseFeatEffect } from "../specialFeats.js";

export function aspectOfTheBeastBearEffect(document) {
  let effect = baseFeatEffect(document, document.name, { transfer: true });

  effect.changes.push(
    {
      key: "flags.midi-qol.advantage.ability.check.str",
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      value: "1",
      priority: "20",
    },
    {
      key: "system.attributes.encumbrance.max",
      mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
      value: "@attributes.encumbrance.max * 2",
      priority: "20",
    },
    {
      key: "system.attributes.encumbrance.pct",
      mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
      value: "dae.eval(100 * attributes.encumbrance.value / attributes.encumbrance.max)",
      priority: "20",
    },
  );

  document.effects.push(effect);
  return document;
}
