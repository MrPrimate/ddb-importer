import DICTIONARY from "../../dictionary.js";
import logger from "../../logger.js";
import DDBHelper from "../../lib/DDBHelper.js";

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
 * @param {*} items
 */
/* eslint-disable complexity */
export function fixSpells(ddb, items) {
  // because the effect parsing happens before this, we need to fix some of the spell changes here
  const usingEffects = ddb === null
    ? game.settings.get("ddb-importer", "munching-policy-add-spell-effects")
    : game.settings.get("ddb-importer", "character-update-policy-add-spell-effects");

  const rangeMultiplier = ddb ? getRangeAdjustmentMultiplier(ddb) : 1;

  items.forEach((spell) => {
    const name = spell.flags.ddbimporter?.originalName ?? spell.name;
    logger.debug(`Checking spell ${name} for corrections...`);
    switch (name) {
      case "Melf's Acid Arrow":
      case "Acid Arrow": {
        if (spell.system.damage?.parts.length > 1) {
          const baseDamage = foundry.utils.duplicate(spell.system.damage.parts[0]);
          const otherDamage = foundry.utils.duplicate(spell.system.damage.parts[1]);
          spell.system.damage.parts = [baseDamage];
          spell.system.formula = otherDamage[0];
        }
        break;
      }
      case "Aid": {
        spell.system.scaling = { mode: "level", formula: "(@item.level - 2) * 5" };
        break;
      }
      case "Armor of Agathys": {
        spell.system.actionType = "util";
        spell.system.target.type = "self";
        spell.system.damage.parts[0] = ["5", "temphp"];
        spell.system.scaling = { mode: "level", formula: "((@item.level - 1) * 5)" };
        break;
      }
      case "Arms of Hadar": {
        spell.system.target.type = "special";
        break;
      }
      case "Absorb Elements":
        if (!usingEffects) {
          spell.system.damage = { parts: [["1d6", ""]], versatile: "", value: "" };
          spell.system.target["value"] = 1;
        }
        spell.system.chatFlavor = "Uses the damage type of the triggered attack: Acid, Cold, Fire, Lightning, or Poison.";
        break;
      case "Booming Blade":
        if (!usingEffects) {
          spell.system.damage = { parts: [["0", "thunder"]], versatile: "1d8", value: "" };
        }
        spell.system.scaling = { mode: "cantrip", formula: "1d8" };
        spell.system.actionType = "other";
        spell.system.target.type = "creature";
        spell.system.target.value = 1;
        spell.system.target.units = "";
        break;
      case "Bones of the Earth": {
        spell.system.target.value = 2.5;
        break;
      }
      case "Catapult": {
        foundry.utils.setProperty(spell, "flags.midiProperties.nodam", true);
        break;
      }
      case "Call Lightning": {
        if (usingEffects) {
          spell.system.damage = { parts: [], versatile: "", value: "" };
          spell.system.save.ability = "";
        }
        break;
      }
      // dnd beyond lists a damage for each type
      case "Chaos Bolt":
        spell.system.damage = { parts: [["2d8", ""], ["1d6", ""]], versatile: "", value: "", };
        break;
      // dnd beyond lists a damage for each type
      case "Chromatic Orb":
        spell.system.damage = { parts: [["3d8", ""]], versatile: "", value: "" };
        spell.system.chatFlavor = "Choose from Acid, Cold, Fire, Lightning, Poison, Thunder, or Acid";
        break;
      case "Color Spray": {
        if (!usingEffects) {
          spell.system.damage = { parts: [["6d10", ""]], versatile: "", value: "" };
        }
        spell.system.scaling = { mode: "level", formula: "2d10" };
        break;
      }
      case "Control Weather": {
        spell.system.target.type = "self";
        spell.system.range = { value: 5, units: "mi", long: null };
        break;
      }
      case "Cloud of Daggers":
        spell.system.actionType = "other";
        break;
      case "Darkvision": {
        spell.system.target.type = "creature";
        break;
      }
      case "Divine Favor": {
        spell.system.actionType = "util";
        spell.system.target.type = "self";
        break;
      }
      case "Dragon's Breath":
        spell.system.damage = { parts: [["3d6", ""]], versatile: "", value: "" };
        spell.system.chatFlavor = "Choose one of Acid, Cold, Fire, Lightning, or Poison.";
        break;
      // Eldritch Blast is a special little kitten and has some fun Eldritch
      // Invocations which can adjust it.
      case "Eldritch Blast": {
        if (!ddb) break;
        const eldritchBlastMods = getEldritchInvocations(ddb);
        spell.system.damage.parts[0][0] += " + " + eldritchBlastMods["damage"];
        spell.system.range.value += eldritchBlastMods["range"];
        break;
      }
      case "False Life": {
        spell.system.actionType = "heal";
        spell.system.target.type = "self";
        spell.system.damage.parts[0] = ["1d4 + 4", "temphp"];
        spell.system.scaling = { mode: "level", formula: "(@item.level - 1) * 5" };
        break;
      }
      case "Guidance": {
        spell.system.target = { value: 1, units: "", type: "creature" };
        break;
      }
      case "Green-Flame Blade":
        if (!usingEffects) {
          spell.system.damage = { parts: [["0", "fire"]], versatile: "@mod", value: "" };
        }
        spell.system.scaling = { mode: "cantrip", formula: "1d8" };
        spell.system.actionType = "other";
        spell.system.target.type = "creature";
        spell.system.target.value = 1;
        spell.system.target.units = "";
        break;
      case "Gust of Wind":
        spell.system.target = { value: 60, units: "ft", type: "line", width: 10 };
        break;
      case "Goodberry":
        spell.system.damage = { parts: [["1", "healing"]], versatile: "", value: "" };
        break;
      case "Heat Metal":
        spell.system.actionType = "save";
        break;
      case "Hex": {
        spell.system.actionType = "other";
        if (usingEffects) {
          spell.system.damage = { parts: [], versatile: "", value: "" };
        }
        break;
      }
      case "Heroes Feast": {
        spell.system.duration = { value: 1, units: "day" };
        break;
      }
      case "Heroism": {
        spell.system.damage.parts[0] = ["@mod", "temphp"];
        break;
      }
      case "Hunter's Mark":
      case "Hunter’s Mark": {
        spell.system.actionType = "other";
        if (usingEffects) {
          spell.system.damage = { parts: [], versatile: "", value: "" };
        } else {
          spell.system.damage = { parts: [["1d6", ""]], versatile: "", value: "" };
        }
        break;
      }
      case "Ice Storm":
        spell.system.damage.parts[0][0] = "(@item.level - 2)d8[bludgeoning]";
        spell.system.scaling = { mode: "", formula: "" };
        break;
      case "Flaming Sphere":
        spell.system.target["value"] = 2.5;
        break;
      case "Light": {
        spell.system.target = { value: 1, width: null, units: "", type: "object" };
        break;
      }
      case "Magic Missile":
        spell.system.actionType = "other";
        break;
      case "Produce Flame":
        spell.system.range = { value: 30, units: "ft", long: null };
        break;
      case "Primal Savagery":
        spell.system.target = { value: 1, width: null, units: "", type: "creature" };
        spell.system.range = { value: 5, units: "ft", long: null };
        break;
      case "Pyrotechnics":
        spell.system.target["value"] = 15;
        break;
      case "Protection from Energy": {
        spell.system.target.type = "creature";
        break;
      }
      case "Ray of Enfeeblement":
        spell.system.actionType = "rsak";
        break;
      case "Shadow of Moil":
        spell.system.actionType = "other";
        break;
      case "Searing Smite": {
        if (spell.system.damage.parts.length > 1) {
          spell.system.formula = spell.system.damage.parts[1][0];
          spell.system.damage.parts = [spell.system.damage.parts[0]];
        }
        spell.system.scaling = { mode: "level", formula: "1d6" };
        break;
      }
      case "Spirit Guardians": {
        if (!ddb) break;
        const radiantAlignments = [1, 2, 3, 4, 5, 6, 10, 14];
        const necroticAlignments = [7, 8, 9, 11];
        if (radiantAlignments.includes(ddb.character.alignmentId)) {
          foundry.utils.setProperty(spell, "flags.ddbimporter.damageType", "radiant");
          spell.system.damage = { parts: [["3d8", "radiant"]], versatile: "", value: "" };
        } else if (necroticAlignments.includes(ddb.character.alignmentId)) {
          foundry.utils.setProperty(spell, "flags.ddbimporter.damageType", "necrotic");
          spell.system.damage = { parts: [["3d8", "necrotic"]], versatile: "", value: "" };
        }
        break;
      }
      case "Spiritual Weapon":
      case "Spirit Shroud": {
        spell.system.scaling = { mode: "level", formula: "floor((@item.level - 1)/2)d8" };
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
      case "Thunder Step":
        spell.system.range = { value: null, units: "spec", long: null };
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

    if (rangeMultiplier != 1) {
      spell = adjustRange(rangeMultiplier, spell);
    }
    if (ddb) DDBHelper.addCustomValues(ddb, spell);
  });
}
/* eslint-enable complexity */
