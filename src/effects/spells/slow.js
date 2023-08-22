import { baseSpellEffect } from "../specialSpells.js";

export function slowEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push(
    { key: "system.attributes.ac.bonus", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: "-2", priority: "20" },
    { key: "system.attributes.movement.all", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: "/2", priority: "20" },
    { key: "system.abilities.dex.bonuses.save", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: "-2", priority: "20" }
  );
  document.effects.push(effect);

  return document;
}
