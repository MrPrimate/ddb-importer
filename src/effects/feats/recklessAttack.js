import { baseFeatEffect } from "../specialFeats.js";

export function recklessAttackEffect(document) {
  let attackEffect = baseFeatEffect(document, `${document.name} (Attack)`);

  attackEffect.changes.push(
    {
      key: "flags.midi-qol.advantage.attack.str",
      value: `1`,
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      priority: 20,
    },
  );


  setProperty(attackEffect, "flags.dae.stackable", "noneName");

  document.effects.push(attackEffect);

  let defenseEffect = baseFeatEffect(document, `${document.name} (Defense)`);

  defenseEffect.changes.push(
    {
      key: "flags.midi-qol.grants.advantage.attack.all",
      value: `1`,
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      priority: 20,
    },
  );
  defenseEffect.duration = {
    startTime: null,
    seconds: 12,
    rounds: 2,
    turns: null,
    startRound: null,
    startTurn: null,
  };
  setProperty(defenseEffect, "flags.dae.specialDuration", ["turnStartSource"]);
  setProperty(defenseEffect, "flags.core.statusId", "Reckless");
  setProperty(defenseEffect, "flags.dae.stackable", "noneName");

  document.effects.push(defenseEffect);

  document.system["target"]["type"] = "self";
  document.system.range = { value: null, units: "self", long: null };
  document.system.actionType = null;
  setProperty(document, "system.activation.type", "special");
  document.system.duration = {
    value: 1,
    units: "turn",
  };

  return document;
}
