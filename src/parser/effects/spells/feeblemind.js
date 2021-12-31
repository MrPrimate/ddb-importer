import { baseSpellEffect } from "../specialSpells.js";

export function feeblemindEffect(document) {
  let effectFeeblemindFeeblemind = baseSpellEffect(document, document.name);
  effectFeeblemindFeeblemind.changes.push(
    { key: "data.abilities.cha.value", value: "1", mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, priority: 50 },
    { key: "data.abilities.int.value", value: "1", mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, priority: 50 },
    { key: "flags.midi-qol.fail.spell.all", value: "1", mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, priority: 20 }
  );
  document.effects.push(effectFeeblemindFeeblemind);

  return document;
}
