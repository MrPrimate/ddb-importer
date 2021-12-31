import { baseSpellEffect } from "../specialSpells.js";

export function trueStrikeEffect(document) {
  let effectTrueStrikeTrueStrike = baseSpellEffect(document, document.name);
  effectTrueStrikeTrueStrike.changes.push({
    key: "flags.midi-qol.advantage.attack.all",
    value: "1",
    mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
    priority: 20,
  });
  document.effects.push(effectTrueStrikeTrueStrike);

  return document;
}
