import { baseFeatEffect } from "../specialFeats.js";

export function hillRuneEffect(document) {
  setProperty(document, "data.target.type", "self");
  setProperty(document, "data.range.units", "self");
  setProperty(document, "data.range.value", "");
  setProperty(document, "data.actionType", null);

  let bonusEffect = baseFeatEffect(document, `${document.name} (Temporary)`);
  bonusEffect.changes.push(
    {
      key: "data.traits.dr.value",
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      value: "bludgeoning",
      priority: "20",
    },
    {
      key: "data.traits.dr.value",
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      value: "slashing",
      priority: "20",
    },
    {
      key: "data.traits.dr.value",
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      value: "piercing",
      priority: "20",
    },
  );
  setProperty(bonusEffect, "duration.seconds", 60);

  document.effects.push(bonusEffect);
  return document;
}
