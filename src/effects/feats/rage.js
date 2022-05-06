import { baseFeatEffect } from "../specialFeats.js";
import utils from "../../utils.js";

export function rageEffect(document) {
  let effect = baseFeatEffect(document, `${document.name}`);

  const scaleSupport = utils.versionCompare(game.data.system.data.version, "1.6.0") >= 0;

  const extraDamage = scaleSupport
    ? "@scale.barbarian.rage"
    : document.flags?.ddbimporter?.dndbeyond?.levelScale?.fixedValue
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
  document.effects.push(effect);
  return document;
}
