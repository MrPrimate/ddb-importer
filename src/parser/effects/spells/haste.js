import { baseSpellEffect } from "../specialSpells.js";

export function hasteEffect(document) {
  let effectHasteHaste = baseSpellEffect(document, document.name);
  effectHasteHaste.changes.push(
    { key: "data.attributes.ac.bonus", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: "+2", priority: "20" },
    {
      key: "flags.midi-qol.advantage.ability.save.dex",
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      value: "+2",
      priority: "20",
    },
    { key: "data.attributes.movement.all", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: "*2", priority: "10" }
  );
  document.effects.push(effectHasteHaste);

  return document;
}
