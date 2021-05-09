// import DICTIONARY from '../dictionary.js';
// import utils from '../../utils.js';


function getDivineSmite() {
    return {
        "flags": {
            "betterRolls5e": {
                "quickDamage": {
                    "context": {
                        "0": "",
                        "1": "Undead or Fiend"
                    },
                    "value": {
                        "0": true,
                        "1": true
                    },
                    "altValue": {
                        "0": true,
                        "1": true
                    }
                }
            }
        },
        "name": "Divine Smite",
        "type": "spell",
        "img": "systems/dnd5e/icons/skills/light_05.jpg",
        "data": {
            "description": {
                "value": "<p>Starting at 2nd level, when you hit a creature with a melee weapon attack, you can expend one spell slot to deal radiant damage to the target, in addition to the weapon&rsquo;s damage.</p>\n<p>The extra damage is 2d8 for a 1st-level spell slot, plus 1d8 for each spell level higher than 1st, to a maximum of 5d8. The damage increases by 1d8 if the target is an undead or a fiend.</p>",
                "chat": "",
                "unidentified": ""
            },
            "source": "PHB PG. 85",
            "activation": {
                "type": "special",
                "cost": null,
                "condition": ""
            },
            "duration": {
                "value": null,
                "units": ""
            },
            "target": {
                "value": 1,
                "units": "",
                "type": "enemy"
            },
            "range": {
                "value": null,
                "long": null,
                "units": ""
            },
            "uses": {
                "value": 0,
                "max": 0,
                "per": ""
            },
            "consume": {
                "type": "",
                "target": "",
                "amount": null
            },
            "ability": "",
            "actionType": "other",
            "attackBonus": 0,
            "chatFlavor": "Smote.",
            "critical": null,
            "damage": {
                "parts": [
                    ["2d8", "radiant"],
                    ["1d8", "radiant"]
                ],
                "versatile": ""
            },
            "formula": "",
            "save": {
                "ability": "",
                "dc": null,
                "scaling": "spell"
            },
            "level": 1,
            "school": "",
            "components": {
                "value": "",
                "vocal": false,
                "somatic": false,
                "material": false,
                "ritual": false,
                "concentration": false
            },
            "materials": {
                "value": "",
                "consumed": false,
                "cost": 0,
                "supply": 0
            },
            "preparation": {
                "mode": "always",
                "prepared": true
            },
            "scaling": {
                "mode": "level",
                "formula": "1d8"
            }
        }
    };
}

/**
 * {
 *  character: character,
 *  features: features,
 *  classes: classes,
 *  inventory: inventory,
 *  spells: spells,
 *  actions: actions,
 *  itemSpells: itemSpells,
 * };
 *
 * @param {*} ddb
 * @param {*} characterJSON
 */
export default function special(characterJSON) {
  const divineSmite = characterJSON.features.concat(characterJSON.actions)
    .some((f) => f.name === "Divine Smite" && f.type === "feat");
  if (divineSmite) {
      characterJSON.spells.push(getDivineSmite());
  }
}
