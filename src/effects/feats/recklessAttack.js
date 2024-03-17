import { baseFeatEffect } from "../specialFeats.js";

export function recklessAttackEffect(document, allMWAK = false) {
  let attackEffect = baseFeatEffect(document, `${document.name} (Attack Effect)`);

  attackEffect.changes.push(
    {
      key: allMWAK ? "flags.midi-qol.advantage.attack.mwak" : "flags.midi-qol.advantage.attack.str",
      value: `1`,
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      priority: 20,
    },
  );


  foundry.utils.setProperty(attackEffect, "flags.dae.stackable", "noneName");

  document.effects.push(attackEffect);

  let defenseEffect = baseFeatEffect(document, `${document.name} (Defense Effect)`);

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
  foundry.utils.setProperty(defenseEffect, "flags.dae.specialDuration", ["turnStartSource"]);
  foundry.utils.setProperty(defenseEffect, "flags.dae.stackable", "noneName");
  defenseEffect.statuses.push("Reckless");

  document.effects.push(defenseEffect);

  document.system["target"]["type"] = "self";
  document.system.range = { value: null, units: "self", long: null };
  document.system.actionType = null;
  foundry.utils.setProperty(document, "system.activation.type", "special");
  document.system.duration = {
    value: 1,
    units: "turn",
  };

  return document;
}
