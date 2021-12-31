import { baseSpellEffect } from "../specialSpells.js";

export function slowEffect(document) {
  let effectSlowSlow = baseSpellEffect(document, document.name);
  effectSlowSlow.changes.push(
    { key: "data.attributes.ac.bonus", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: "-2", priority: "20" },
    { key: "data.attributes.movement.all", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: "/2", priority: "20" },
    { key: "data.abilities.dex.save", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: "-2", priority: "20" }
  );
  document.effects.push(effectSlowSlow);

  return document;
}
