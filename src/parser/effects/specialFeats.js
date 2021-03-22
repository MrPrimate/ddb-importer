import { baseItemEffect } from "./effects.js";

/**
 * This function is mainly for effects that can't be dynamically generated
 * @param {*} document
 */
export function featureEffectAdjustment(document) {
  switch (document.name) {
    case "Rage": {
      let effect = baseItemEffect(document, `${document.name}`);

      const extraDamage = document.flags?.ddbimporter?.dndbeyond?.levelScale?.fixedValue
        ? document.flags.ddbimporter.dndbeyond.levelScale.fixedValue
        : 2;
      effect.changes.push(
        {
          key: "data.bonuses.mwak.damage",
          value: `${extraDamage}`,
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          priority: 0,
        },
        {
          key: "data.traits.dr.value",
          value: "piercing",
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          priority: 0,
        },
        {
          key: "data.traits.dr.value",
          value: "slashing",
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          priority: 20,
        },
        {
          key: "data.traits.dr.value",
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
        }
      );
      effect.duration = {
        startTime: null,
        seconds: 60,
        rounds: null,
        turns: null,
        startRound: null,
        startTurn: null,
      };
      effect.transfer = false;
      effect.disabled = false;
      effect.flags.dae.transfer = false;
      effect.flags.dae.stackable = false;
      document.effects.push(effect);
      break;
    }
    // no default
  }

  return document;
}
