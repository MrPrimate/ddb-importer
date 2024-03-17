import DDBMacros from "../DDBMacros.js";
import { effectModules } from "../effects.js";
import { baseSpellEffect } from "../specialSpells.js";

export async function absorbElementsEffect(document) {
  const effect = baseSpellEffect(document, `${document.name} - Extra Damage`);
  effect.changes.push(
    {
      key: "system.bonuses.mwak.damage",
      value: `(@item.level)d6`,
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      priority: 20,
    },
    {
      key: "system.bonuses.msak.damage",
      value: `(@item.level)d6`,
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      priority: 20,
    },
  );

  effect.flags.dae.specialDuration = ["DamageDealt", "turnEnd"];
  effect.duration.rounds = 2;
  effect.duration.startTurn = 1;

  document.effects.push(effect);

  const resistanceEffect = baseSpellEffect(document, `${document.name} - Resistance`);
  resistanceEffect.changes.push(
    {
      key: "system.traits.dr.value",
      value: "fire",
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      priority: 20,
    },
  );
  resistanceEffect.duration.rounds = 2;
  foundry.utils.setProperty(resistanceEffect, "flags.dae.specialDuration", ["turnStartSource"]);
  document.effects.push(resistanceEffect);

  document.system.damage = {
    parts: [],
    versatile: "",
    value: "",
  };
  document.system.target = {
    value: null,
    width: null,
    units: "",
    type: "self",
  };
  document.system.range = {
    value: null,
    long: null,
    units: "self",
  };
  foundry.utils.setProperty(document, "system.actionType", "util");

  if (effectModules().midiQolInstalled) {
    await DDBMacros.setItemMacroFlag(document, "spell", "absorbElements.js");
    DDBMacros.setMidiOnUseMacroFlag(document, "spell", "absorbElements.js", ["postActiveEffects"]);
    foundry.utils.setProperty(document, "system.activation.type", "reactiondamage");
  }

  return document;
}


