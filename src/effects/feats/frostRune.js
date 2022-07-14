import { baseFeatEffect } from "../specialFeats.js";

export async function frostRuneEffect(document) {
  let baseEffect = baseFeatEffect(document, document.name);
  setProperty(document, "data.target.type", "self");
  setProperty(document, "data.range.units", "");
  setProperty(document, "data.range.value", null);

  baseEffect.transfer = true;
  baseEffect.changes.push(
    {
      key: "flags.midi-qol.advantage.skill.ani",
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      value: "1",
      priority: "20",
    },
    {
      key: "flags.midi-qol.advantage.skill.itm",
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      value: "1",
      priority: "20",
    },
  );

  document.effects.push(baseEffect);


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
