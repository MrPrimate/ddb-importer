import { baseFeatEffect } from "../specialFeats.js";

export function frostRuneEffect(document) {
  setProperty(document, "data.target.type", "self");
  setProperty(document, "data.range.units", "self");
  setProperty(document, "data.range.value", "");
  setProperty(document, "data.actionType", null);

  let bonusEffect = baseFeatEffect(document, `${document.name} (Sturdiness)`);
  bonusEffect.changes.push(
    {
      key: "data.abilities.con.bonuses.check",
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      value: "+2",
      priority: "20",
    },
    {
      key: "data.abilities.con.bonuses.save",
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      value: "+2",
      priority: "20",
    },
    {
      key: "data.abilities.str.bonuses.check",
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      value: "+2",
      priority: "20",
    },
    {
      key: "data.abilities.str.bonuses.save",
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      value: "+2",
      priority: "20",
    },
  );
  setProperty(bonusEffect, "duration.seconds", 600);
  document.effects.push(bonusEffect);

  return document;
}
