import { baseItemEffect } from "./effects.js";
// Bracers of Archery
// +2 damage to longbows/shortbows translates to +2 ranged weapon damage

// {
//   "key": "data.bonuses.rwak.damage",
//   "value": "+2",
//   "mode": 0,
//   "priority": 20
// }

// Demon Armor
// Unarmed strikes bonus/weapons

// {
//   "key": "items.Unarmed Strike.data.attackBonus",
//   "value": "1",
//   "mode": 2,
//   "priority": 20
// },
// {
//   "key": "items.Unarmed Strike.data.damage.parts.0.0",
//   "value": "1d8+@mod+1",
//   "mode": 5,
//   "priority": 20
// },
// {
//   "key": "items.Unarmed Strike.data.properties.mgc",
//   "value": "true",
//   "mode": 5,
//   "priority": 20
// }

/**
 * This function is mainly for effects that can't be dynamically generated
 * @param {*} document
 */
export function equipmentEffectAdjustment(document) {
  switch (document.name) {
    case "Armor of Invulnerability": {
      let effect = baseItemEffect(document, `${document.name} - Invulnerability`);
      effect.changes.push({
        key: "data.traits.di.value",
        value: "physical",
        mode: 2,
        priority: 20,
      });
      effect.duration = {
        startTime: null,
        seconds: 600,
        rounds: null,
        turns: null,
        startRound: null,
        startTurn: null,
      };
      effect.transfer = false;
      effect.disabled = false;
      effect.flags.dae.transfer = false;
      effect.flags.dae.stackable = false;
      effect.flags.dae.specialDuration = "None";
      document.data.uses = {
        value: 1,
        max: "1",
        per: "day",
      };
      document.data.target = {
        value: null,
        width: null,
        units: "",
        type: "self",
      };
      document.data.range = {
        value: null,
        long: null,
        units: "self",
      };
      document.effects.push(effect);
      break;
    }
    // no default
  }

  return document;
}
