import { baseFeatEffect } from "../specialFeats.js";

export function blessedStrikesEffect(document) {
  if (document.data.actionType === null) return document;
  let effect = baseFeatEffect(document, document.name);

  effect.changes.push(
    {
      key: "flags.midi-qol.optional.blessedstrikes.label",
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      value: `${document.name} Bonus Damage`,
      priority: "5",
    },
    {
      key: "flags.midi-qol.optional.blessedstrikes.count",
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      value: "each-round",
      priority: "5",
    },
    {
      key: "flags.midi-qol.optional.blessedstrikes.damage.all",
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      value: `${document.data.damage.parts[0][0]}`,
      priority: "5",
    },
  );

  document.data.damage.parts = [];
  document.data.actionType = null;
  effect.transfer = true;

  document.effects.push(effect);
  return document;
}
