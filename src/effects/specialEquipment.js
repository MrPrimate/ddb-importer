import {
  baseItemEffect,
  generateUpgradeChange,
  generateUnsignedAddChange,
  generateCustomChange,
  forceItemEffect,
  effectModules,
  applyDefaultMidiFlags,
  addSimpleConditionEffect,
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
  if (foundry.utils.getProperty(document, "flags.ddbimporter.dndbeyond.homebrew")) return document;

  const name = document.flags.ddbimporter?.originalName || document.name;

  switch (name) {
    case "Horn of Blasting": {
      document = addSimpleConditionEffect(document, "deafened");
      break;
    }
    // no default
  }

  if (!effectModules().hasCore) return document;
  document = applyDefaultMidiFlags(document);

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
          generateCustomChange(1, 20, "flags.midi-qol.grants.disadvantage.attack.rsak"),
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
  // to do revisit these
  return document;
  if (foundry.utils.getProperty(document, "flags.ddbimporter.dndbeyond.homebrew")) return document;
  const name = document.flags.ddbimporter?.originalName ?? document.name;
  switch (name) {
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
        },
      );
      break;
    }
    case "Belashyrra’s Beholder Crown": {
      let effect = baseItemEffect(document, `${document.name} - Passive Effects`);
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
