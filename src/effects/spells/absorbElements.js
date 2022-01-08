
import { baseSpellEffect } from "../specialSpells.js";

export function absorbElementsEffect(document) {
  const effect = baseSpellEffect(document, `${document.name} - Extra Damage`);
  effect.changes.push({
    key: "data.bonuses.mwak.damage",
    value: `(@item.level)d6`,
    mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
    priority: 0,
  });
  effect.flags.dae.specialDuration = "1Hit";
  effect.duration = {
    startTime: null,
    seconds: null,
    rounds: 1,
    turns: null,
    startRound: null,
    startTurn: null,
  };
  document.data.damage = {
    parts: [["", ""]],
    versatile: "",
    value: "",
  };
  document.data.target = {
    value: null,
    width: null,
    units: "",
    type: "self",
  };
  document.data.range = {
    value: null,
    long: null,
    units: "self",
  };
  document.effects.push(effect);

  return document;
}


