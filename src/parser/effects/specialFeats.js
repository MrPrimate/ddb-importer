// import { baseItemEffect } from "./effects.js";

/**
 * This function is mainly for effects that can't be dynamically generated
 * @param {*} document
 */
export function featureEffectAdjustment(document) {
  switch (document.name) {
    case "Rage": {
      // this effect is 1/day, we have to add it
      let effect = baseItemEffect(document, `${document.name}`);
      effect.changes.push(
        {
          key: "data.bonuses.mwak.damage",
          value: "2",
          mode: 0,
          priority: 0,
        },
        {
          key: "data.traits.dr.value",
          value: "piercing",
          mode: 0,
          priority: 0,
        },
        {
          key: "data.traits.dr.value",
          value: "slashing",
          mode: 0,
          priority: 20,
        },
        {
          key: "data.traits.dr.value",
          value: "bludgeoning",
          mode: 0,
          priority: 20,
        }
      );
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
