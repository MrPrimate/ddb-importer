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

// Armor of Invulnerability
// entire action for the special one - this is kind of in the modifiers
// {
//   "flags": {
//     "dae": {
//       "stackable": false,
//       "specialDuration": "None",
//       "transfer": false
//     }
//   },
//   "changes": [
//     {
//       "key": "data.traits.di.value",
//       "value": "physical",
//       "mode": 2,
//       "priority": 20
//     }
//   ],
//   "disabled": false,
//   "duration": {
//     "startTime": null,
//     "seconds": 600,
//     "rounds": null,
//     "turns": null,
//     "startRound": null,
//     "startTurn": null
//   },
//   "label": "Armor of Invulnerability",
//   "tint": "",
//   "transfer": false
// }

/**
 * This function is mainly for effects that can't be dynamically generated
 * @param {*} document
 */
export function effectAdjustment(document) {

  return document;
}
