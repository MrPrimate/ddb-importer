import { baseSpellEffect } from "../specialSpells.js";

export function baneEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push(
    { key: "system.bonuses.mwak.attack", value: "-1d4", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, priority: 0 },
    { key: "system.bonuses.rwak.attack", value: "-1d4", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, priority: 0 },
    { key: "system.bonuses.msak.attack", value: "-1d4", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, priority: 0 },
    { key: "system.bonuses.rsak.attack", value: "-1d4", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, priority: 0 },
    { key: "system.bonuses.abilities.save", value: "-1d4", mode: CONST.ACTIVE_EFFECT_MODES.ADD, priority: 20 }
  );
  document.effects.push(effect);

  return document;
}
