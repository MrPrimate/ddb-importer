import { baseFeatEffect } from "../specialFeats.js";

export function rageEffect(document) {
  let effect = baseFeatEffect(document, `${document.name}`);

  effect.changes.push(
    {
      key: "system.bonuses.mwak.damage",
      value: "+ @scale.barbarian.rage",
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      priority: 0,
    },
    {
      key: "system.traits.dr.value",
      value: "piercing",
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      priority: 0,
    },
    {
      key: "system.traits.dr.value",
      value: "slashing",
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      priority: 20,
    },
    {
      key: "system.traits.dr.value",
      value: "bludgeoning",
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      priority: 20,
    },
    {
      key: "flags.midi-qol.advantage.ability.save.str",
      value: "1",
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      priority: 20,
    },
    {
      key: "flags.midi-qol.advantage.ability.check.str",
      value: "1",
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      priority: 20,
    },
    {
      key: "macro.tokenMagic",
      value: "outline",
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      priority: 10,
    },
  );
  effect.duration = {
    startTime: null,
    seconds: 60,
    rounds: null,
    turns: null,
    startRound: null,
    startTurn: null,
  };
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
  document.system.range = { value: null, units: "self", long: null };
  document.effects.push(effect);
  return document;
}
