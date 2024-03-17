import { baseFeatEffect } from "../specialFeats.js";

export function hillRuneEffect(document) {
  foundry.utils.setProperty(document, "system.target.type", "self");
  foundry.utils.setProperty(document, "system.range.units", "self");
  foundry.utils.setProperty(document, "system.range.value", "");
  foundry.utils.setProperty(document, "system.actionType", null);

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
  foundry.utils.setProperty(bonusEffect, "duration.seconds", 60);

  document.effects.push(bonusEffect);
  return document;
}
