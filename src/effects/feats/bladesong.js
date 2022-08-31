import { baseFeatEffect } from "../specialFeats.js";

export function bladesongEffect(document) {
  let effect = baseFeatEffect(document, `${document.name}`);

  setProperty(document, "system.range", { value: null, units: "self", long: null });
  setProperty(document, "system.range.value", null);
  setProperty(document, "system.target.type", "self");
  setProperty(effect, "flags.dae.selfTarget", true);

  effect.changes.push(
    {
      key: "system.attributes.ac.bonus",
      value: "max(@abilities.int.mod,1)",
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      priority: 20,
    },
    {
      key: "flags.midi-qol.advantage.skill.acr",
      value: "1",
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      priority: 20,
    },
    {
      key: "flags.midi-qol.concentrationSaveBonus",
      value: "max(@abilities.int.mod,1)",
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      priority: 20,
    },
    {
      key: "system.attributes.movement.walk",
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      value: "10",
      priority: "20",
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
  document.effects.push(effect);
  return document;
}
