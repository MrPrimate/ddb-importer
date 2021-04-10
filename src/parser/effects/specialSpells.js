import { baseItemEffect } from "./effects.js";

/**
 * This function is mainly for effects that can't be dynamically generated
 * @param {*} document
 */
export function spellEffectAdjustment(document) {
  switch (document.name) {
    case "Absorb Elements": {
      const effect = baseItemEffect(document, `${document.name} - Extra Damage`);
      effect.changes.push({
        key: "data.bonuses.mwak.damage",
        value: `(@item.level)d6`,
        mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
        priority: 0,
      });
      effect.transfer = false;
      effect.disabled = false;
      effect.flags.dae.transfer = false;
      effect.flags.dae.stackable = false;
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
      break;
    }
    // no default
  }
  return document;
}
