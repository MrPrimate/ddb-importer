import { baseFeatEffect } from "../specialFeats.js";

export async function hillRuneEffect(document) {

  let baseEffect = baseFeatEffect(document, document.name);
  setProperty(document, "data.target.type", "self");
  setProperty(document, "data.range.units", "");
  setProperty(document, "data.range.value", null);

  baseEffect.changes.push(
    {
      key: "data.traits.dr.value",
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      value: "poison",
      priority: "20",
    },
  );
  // Missing : advantage of saving throws against being poisoned

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


  document.effects.push(baseEffect);
  return document;
}
