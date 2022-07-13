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
  attackEffect.duration = {
    startTime: null,
    seconds: null,
    rounds: 1,
    turns: null,
    startRound: null,
    startTurn: null,
  };

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
  setProperty(defenseEffect, "flags.dae.specialDuration", ["turnStartSource"]);
  setProperty(defenseEffect, "flags.core.statusId", "Reckless");

  document.effects.push(defenseEffect);

  document.data["target"]["type"] = "self";
  document.data.range = { value: null, units: "self", long: null };
  document.data.actionType = null;
  document.data.activation = { type: "none", cost: null, condition: "" };

  return document;
}
