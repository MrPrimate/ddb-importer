import { baseFeatEffect } from "../specialFeats.js";

export function hillRuneEffect(document) {
  setProperty(document, "system.target.type", "self");
  setProperty(document, "system.range.units", "self");
  setProperty(document, "system.range.value", "");
  setProperty(document, "system.actionType", null);

  let bonusEffect = baseFeatEffect(document, `${document.name} (Temporary)`);
  bonusEffect.changes.push(
    {
      key: "system.traits.dr.value",
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      value: "bludgeoning",
      priority: "20",
    },
    {
      key: "system.traits.dr.value",
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      value: "slashing",
      priority: "20",
    },
    {
      key: "system.traits.dr.value",
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      value: "piercing",
      priority: "20",
    },
  );
  setProperty(bonusEffect, "duration.seconds", 60);

  document.effects.push(bonusEffect);
  return document;
}
