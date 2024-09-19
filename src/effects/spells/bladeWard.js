import { baseSpellEffect } from "../specialSpells.js";

export function bladeWardEffect(document) {
  const resistanceEffect = baseSpellEffect(document, `${document.name} - Resistance`);
  resistanceEffect.changes.push(
    {
      key: "system.traits.dr.value",
      value: "bludgeoning",
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      priority: 20,
    },
    {
      key: "system.traits.dr.value",
      value: "slashing",
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      priority: 20,
    },
    {
      key: "system.traits.dr.value",
      value: "piercing",
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      priority: 20,
    },
  );
  resistanceEffect.duration.rounds = 2;
  foundry.utils.setProperty(resistanceEffect, "flags.dae.specialDuration", ["turnEnd"]);
  document.effects.push(resistanceEffect);
  foundry.utils.setProperty(document, "system.actionType", "util");

  return document;
}


