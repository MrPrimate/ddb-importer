import { baseFeatEffect } from "../specialFeats.js";

export function visageOfTheAstralSelfEffect(document) {
  let effect = baseFeatEffect(document, `${document.name}`);

  effect.changes.push(
    {
      key: "flags.midi-qol.advantage.skill.itm",
      value: `1`,
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      priority: 20,
    },
    {
      key: "flags.midi-qol.advantage.skill.ins",
      value: `1`,
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      priority: 20,
    },
    {
      key: "ATL.sight.visionMode",
      value: `basic`,
      mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
      priority: 20,
    },
    {
      key: "ATL.sight.range",
      value: `120`,
      mode: CONST.ACTIVE_EFFECT_MODES.UPGRADE,
      priority: 20,
    },
  );
  effect.duration = {
    startTime: null,
    seconds: 360,
    rounds: null,
    turns: null,
    startRound: null,
    startTurn: null,
  };
  foundry.utils.setProperty(effect, "flags.dae.selfTarget", true);
  foundry.utils.setProperty(effect, "flags.dae.selfTargetAlways", true);

  document.effects.push(effect);

  document.system["target"]["type"] = "self";
  document.system.range = { value: null, units: "self", long: null };
  document.system.actionType = null;
  document.system.duration = {
    value: 10,
    units: "minute",
  };


  return document;
}
