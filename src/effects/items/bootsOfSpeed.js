import {
  baseItemEffect,
  generateMultiplyChange,
} from "../effects.js";

export function bootsOfSpeedEffect(document) {
  let effect = baseItemEffect(document, `${document.name}`);
  effect.changes.push(generateMultiplyChange(2, 20, "system.attributes.movement.walk"));
  effect.duration = {
    startTime: null,
    seconds: 600,
    rounds: null,
    turns: null,
    startRound: null,
    startTurn: null,
  };
  effect.transfer = true;
  effect.disabled = true;
  effect.flags.dae.transfer = true;
  effect.flags.dae.stackable = true;
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
  document.system.activation.type = "bonus";
  document.effects.push(effect);

  return document;
}
