import { baseSpellEffect } from "../specialSpells.js";

export function baneEffect(document) {
  let effectBaneBane = baseSpellEffect(document, document.name);
  effectBaneBane.changes.push(
    { key: "data.bonuses.All-Attacks", value: "-1d4", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, priority: 0 },
    { key: "data.bonuses.abilities.save", value: "-1d4", mode: CONST.ACTIVE_EFFECT_MODES.ADD, priority: 20 }
  );
  document.effects.push(effectBaneBane);

  return document;
}
