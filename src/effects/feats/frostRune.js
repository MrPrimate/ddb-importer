import { baseFeatEffect } from "../specialFeats.js";

export function frostRuneEffect(document) {
  setProperty(document, "system.target.type", "self");
  setProperty(document, "system.range.units", "self");
  setProperty(document, "system.range.value", "");
  setProperty(document, "system.actionType", null);

  let bonusEffect = baseFeatEffect(document, `${document.name} (Sturdiness)`);
  bonusEffect.changes.push(
    {
      key: "system.abilities.con.bonuses.check",
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      value: "+2",
      priority: "20",
    },
    {
      key: "system.abilities.con.bonuses.save",
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      value: "+2",
      priority: "20",
    },
    {
      key: "system.abilities.str.bonuses.check",
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      value: "+2",
      priority: "20",
    },
    {
      key: "system.abilities.str.bonuses.save",
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      value: "+2",
      priority: "20",
    },
  );
  setProperty(bonusEffect, "duration.seconds", 600);
  document.effects.push(bonusEffect);

  return document;
}
