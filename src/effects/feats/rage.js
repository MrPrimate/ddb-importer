import { baseFeatEffect } from "../specialFeats.js";

export function rageEffect(document) {
  let effect = baseFeatEffect(document, `${document.name}`);

  const useScale = game.settings.get("ddb-importer", "character-update-policy-use-scalevalue");
  const extraDamage = useScale
    ? "@scale.barbarian.rage"
    : document.flags?.ddbimporter?.dndbeyond?.levelScale?.fixedValue
      ? document.flags.ddbimporter.dndbeyond.levelScale.fixedValue
      : 2;
  effect.changes.push(
    {
      key: "system.bonuses.mwak.damage",
      value: `${extraDamage}`,
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      priority: 0,
    },
    {
      key: "system.traits.dr.value",
      value: "piercing",
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      priority: 0,
    },
    {
      key: "system.traits.dr.value",
      value: "slashing",
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      priority: 20,
    },
    {
      key: "system.traits.dr.value",
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
  document.system.damage = {
    parts: [],
    versatile: "",
    value: "",
  };
  document.system.target = {
    value: null,
    width: null,
    units: "",
    type: "self",
  };
  document.system.range = { value: null, units: "self", long: null };
  document.effects.push(effect);
  return document;
}
