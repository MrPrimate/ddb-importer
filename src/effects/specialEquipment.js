import {
  baseItemEffect,
  generateUpgradeChange,
  generateUnsignedAddChange,
  generateCustomChange,
  forceItemEffect,
  effectModules,
  applyDefaultMidiFlags,
} from "./effects.js";
// load item effects
import { bootsOfSpeedEffect } from "./items/bootsOfSpeed.js";
import { cloakOfDisplacementEffect } from "./items/cloakOfDisplacement.js";
import { javelinOfLightningEffect } from "./items/javelinOfLightning.js";
import { moonSickleEffect } from "./items/moonSickle.js";
import { pearlOfPowerEffect } from "./items/pearlOfPower.js";
import { stoneOfGoodLuckEffect } from "./items/stoneOfGoodLuck.js";
import { hasteEffect } from "./spells/haste.js";


export async function midiItemEffects(document) {
  if (!effectModules().hasCore) return document;
  document = applyDefaultMidiFlags(document);
  const name = document.flags.ddbimporter?.originalName || document.name;
  switch (name) {
    case "Cloak of Displacement": {
      document = await cloakOfDisplacementEffect(document);
      break;
    }
    case "Javelin of Lightning":
    case "Tempus Javelin": {
      document = await javelinOfLightningEffect(document);
      break;
    }
    case "Pearl of Power": {
      document = await pearlOfPowerEffect(document);
      break;
    }
    case "Potion of Speed": {
      document = hasteEffect(document);
      break;
    }
    case "Spellguard Shield": {
      if (document.effects && document.effects.length > 0) {
        document.effects[0].changes.push(
          generateCustomChange(1, 20, "flags.midi-qol.grants.disadvantage.attack.msak"),
          generateCustomChange(1, 20, "flags.midi-qol.grants.disadvantage.attack.rsak")
        );
      }
      break;
    }
    // no default
  }

  return forceItemEffect(document);
}

/**
 * This function is mainly for effects that can't be dynamically generated
 * @param {*} document
 */
export function equipmentEffectAdjustment(document) {
  const name = document.flags.ddbimporter?.originalName ?? document.name;
  switch (name) {
    case "Armor of Invulnerability": {
      // this effect is 1/day, we have to add it
      let effect = baseItemEffect(document, `${document.name} - Invulnerability`, { transfer: false, disabled: false });
      effect.changes.push(generateUnsignedAddChange("physical", 20, "system.traits.di.value"));
      effect.duration = {
        startTime: null,
        seconds: 600,
        rounds: null,
        turns: null,
        startRound: null,
        startTurn: null,
      };
      effect.flags.dae.stackable = false;
      document.system.uses = {
        value: 1,
        max: "1",
        per: "day",
      };
      document.system.target = {
        value: null,
        width: null,
        units: "",
        type: "self",
      };
      document.system.range = {
        value: null,
        long: null,
        units: "self",
      };
      document.effects.push(effect);
      break;
    }
    case "Bracers of Archery": {
      // +2 damage to longbows/shortbows translates to +2 ranged weapon damage
      document.effects[0].changes.push({
        key: "system.bonuses.rwak.damage",
        value: "+2",
        mode: 0,
        priority: 20,
      });
      break;
    }
    case "Demon Armor": {
      // Unarmed strikes bonus/weapons
      document.effects[0].changes.push(
        {
          key: "items.Unarmed Strike.system.attack.bonus",
          value: "1",
          mode: 2,
          priority: 20,
        },
        {
          key: "items.Unarmed Strike.system.damage.parts.0.0",
          value: "1d8+@mod+1",
          mode: 5,
          priority: 20,
        },
        {
          key: "items.Unarmed Strike.system.properties.mgc",
          value: "true",
          mode: 5,
          priority: 20,
        }
      );
      break;
    }
    case "Belashyrra’s Beholder Crown": {
      let effect = baseItemEffect(document, `${document.name} - Constant Effects`);
      effect.changes.push(generateUpgradeChange(120, 10, "system.attributes.senses.darkvision"));
      document.effects.push(effect);
      break;
    }
    case "Boots of Speed": {
      document = bootsOfSpeedEffect(document);
      break;
    }
    case "Moon Sickle, +1":
    case "Moon Sickle, +2":
    case "Moon Sickle, +3":
    case "Moon Sickle": {
      document = moonSickleEffect(document);
      break;
    }
    case "Stone of Good Luck (Luckstone)":
    case "Luckstone":
    case "Stone of Good Luck": {
      document = stoneOfGoodLuckEffect(document);
      break;
    }
    // no default
  }

  return forceItemEffect(document);
}
