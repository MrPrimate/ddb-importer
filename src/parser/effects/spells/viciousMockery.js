import { baseSpellEffect } from "../specialSpells.js";

export function viciousMockeryEffect(document) {
  let effectViciousMockeryViciousMockery = baseSpellEffect(document, document.name);
  effectViciousMockeryViciousMockery.changes.push({
    key: "flags.midi-qol.disadvantage.attack.all",
    value: "1",
    mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
    priority: 20,
  });
  document.effects.push(effectViciousMockeryViciousMockery);

  return document;
}
