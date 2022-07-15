import { baseSpellEffect } from "../specialSpells.js";

export function feeblemindEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push(
    { key: "system.abilities.cha.value", value: "1", mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, priority: 50 },
    { key: "system.abilities.int.value", value: "1", mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, priority: 50 },
    { key: "flags.midi-qol.fail.spell.all", value: "1", mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, priority: 20 }
  );
  document.effects.push(effect);

  return document;
}
