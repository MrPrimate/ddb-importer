import DICTIONARY from "../../dictionary.js";
import logger from "../../logger.js";
import DDBHelper from "../../lib/DDBHelper.js";
import CompendiumHelper from "../../lib/CompendiumHelper.js";

let getEldritchInvocations = (ddb) => {
  let damage = "";
  let range = 0;

  const eldritchBlastMods = DDBHelper.filterBaseModifiers(ddb, "eldritch-blast").filter((modifier) => modifier.isGranted);

  eldritchBlastMods.forEach((mod) => {
    switch (mod.subType) {
      case "bonus-damage": {
        // almost certainly CHA :D
        const abilityModifierLookup = DICTIONARY.character.abilities.find((ability) => ability.id === mod.statId);
        if (abilityModifierLookup) {
          if (damage !== "") damage += " + ";
          damage += `@abilities.${abilityModifierLookup.value}.mod`;
        } else if (mod.fixedValue) {
          if (damage !== "") damage += " + ";
          damage += `${mod.fixedValue}`;
        }
        break;
      }
      case "bonus-range":
        range = mod.value;
        break;
      default:
        logger.warn(`Not yet able to process ${mod.subType}, please raise an issue.`);
    }
  });

  return {
    damage: damage,
    range: range,
  };
};

function getRangeAdjustmentMultiplier(ddb) {
  const rangeAdjustmentMods = DDBHelper.filterBaseModifiers(ddb, "bonus", { subType: "spell-attack-range-multiplier" }).filter((modifier) => modifier.isGranted);

  const multiplier = rangeAdjustmentMods.reduce((current, mod) => {
    if (Number.isInteger(mod.fixedValue) && mod.fixedValue > current) {
      current = mod.fixedValue;
    } else if (Number.isInteger(mod.value) && mod.value > current) {
      current = mod.value;
    }
    return current;
  }, 1);

  return multiplier;
}

function adjustRange(multiplier, spell) {
  if (spell.system.actionType === "rsak" && Number.isInteger(spell.system.range?.value)) {
    foundry.utils.setProperty(spell, "system.range.value", spell.system.range.value * multiplier);
  }
  return spell;
}

/**
 * Some spells we need to fix up or massage because they are modified
 * in interesting ways
 * @param {*} ddb
 * @param {*} documents
 */
/* eslint-disable complexity */
export async function fixSpells(ddb, documents) {

  return;
  // because the effect parsing happens before this, we need to fix some of the spell changes here
  const usingEffects = ddb === null
    ? game.settings.get("ddb-importer", "munching-policy-add-spell-effects")
    : game.settings.get("ddb-importer", "character-update-policy-add-spell-effects");

  const rangeMultiplier = ddb ? getRangeAdjustmentMultiplier(ddb) : 1;

  for (let spell of documents) {
    const name = spell.flags.ddbimporter?.originalName ?? spell.name;
    logger.debug(`Checking spell ${name} for corrections...`);
    switch (name) {
      case "Spiritual Weapon":
      case "Spirit Shroud": {
        spell.system.damage.parts = [["(floor(@item.level / 2))d8 + @mod"]["radiant"]];
        spell.system.scaling = { mode: "none", formula: "" };
        // spell.system.scaling = { mode: "level", formula: "(floor((@item.level - 1)/2))d8" };
        break;
      }
      case "Spike Growth": {
        spell.system.actionType = "other";
        break;
      }
      case "Sleep": {
        if (!usingEffects) {
          spell.system.damage = { parts: [["5d8", ""]], versatile: "", value: "" };
        }
        spell.system.scaling = { mode: "level", formula: "2d8" };
        break;
      }
      case "Tidal Wave":
        spell.system.target = {
          "value": "30",
          "units": "ft",
          "type": "line",
          "width": 10,
          "prompt": true,
        };
        break;
      case "Thorn Whip": {
        spell.system.actionType = "msak";
        break;
      }
      // The target/range input data are incorrect on some AOE spells centred
      // on self.
      // Range is self with an AoE target of 15 ft cube
      // i.e. affects all creatures within 5 ft of caster
      case "Thunderclap":
      case "Word of Radiance":
        spell.system.range = { value: null, units: "spec", long: null };
        spell.system.target = { value: 15, units: "ft", type: "cube" };
        break;
      case "Toll the Dead":
        spell.system.scaling = { mode: "cantrip", formula: "" };
        break;
      case "Vitriolic Sphere": {
        spell.system.scaling = { mode: "level", formula: "2d4" };
        break;
      }
      // no default
    }

  };

}
/* eslint-enable complexity */
