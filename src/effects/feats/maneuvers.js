import { baseFeatEffect } from "../specialFeats.js";
import { addStatusEffectChange } from "../effects.js";
import { logger } from "../../lib/_module.mjs";

function dermineDiceString(ddb) {
  const fighterClass = ddb.character.classes.find((klass) => klass.definition.name === "Fighter");
  if (fighterClass) {
    const combatSuperiority = fighterClass.classFeatures.find((feat) => feat.definition.name === "Combat Superiority");
    if (combatSuperiority) {
      return "@scale.battle-master.combat-superiority-die";
    }
  }
  return "1d6";
}

// eslint-disable-next-line complexity
export async function maneuversEffect(ddb, character, document) {
  const diceString = dermineDiceString(ddb);

  logger.debug(`Generating effect for ${document.name}`);

  const characterAbilities = character.flags.ddbimporter.dndbeyond.effectAbilities;
  const ability = characterAbilities.str?.value > characterAbilities.dex?.value ? "str" : "dex";

  const name = document.flags.ddbimporter?.originalName ?? document.name;
  let effect = baseFeatEffect(document, document.name);
  foundry.utils.setProperty(document, "system.range.units", "");
  foundry.utils.setProperty(document, "system.range.value", null);
  foundry.utils.setProperty(document, "system.target.type", "self");

  // special durations
  switch (name) {
    case "Maneuvers: Bait and Switch": {
      foundry.utils.setProperty(effect, "flags.dae.specialDuration", ["turnStartSource"]);
      break;
    }
    case "Maneuvers: Trip Attack": {
      foundry.utils.setProperty(document, "system.duration.units", "inst");
      break;
    }
    case "Maneuvers: Menacing Attack":
    case "Maneuvers: Goading Attack": {
      foundry.utils.setProperty(effect, "flags.dae.specialDuration", ["turnEndSource"]);
      break;
    }
    case "Maneuvers: Grappling Strike": {
      foundry.utils.setProperty(effect, "duration.turns", 1);
      foundry.utils.setProperty(effect, "flags.dae.specialDuration", ["isSkill.ath"]);
      break;
    }
    case "Maneuvers: Parry": {
      foundry.utils.setProperty(document, "system.duration.units", "inst");
      foundry.utils.setProperty(effect, "flags.dae.specialDuration", ["isDamaged"]);
      break;
    }
    // no default
  }

  // other effects
  switch (name) {
    case "Maneuvers: Evasive Footwork":
    case "Maneuvers: Bait and Switch": {
      effect.changes.push(
        {
          "key": "system.attributes.ac.bonus",
          "mode": CONST.ACTIVE_EFFECT_MODES.ADD,
          "value": `+ ${diceString}`,
          "priority": "20",
        },
      );
      document.effects.push(effect);
      break;
    }
    case "Maneuvers: Grappling Strike": {
      effect.changes.push(
        {
          "key": "system.skills.ath.bonuses.check",
          "mode": CONST.ACTIVE_EFFECT_MODES.ADD,
          "value": `+ ${diceString}`,
          "priority": "20",
        },
      );
      document.effects.push(effect);
      break;
    }
    case "Maneuvers: Menacing Attack": {
      addStatusEffectChange({ effect, statusName: "Frightened" });
      break;
    }
    case "Maneuvers: Trip Attack": {
      addStatusEffectChange({ effect, statusName: "Prone" });
      break;
    }
    case "Maneuvers: Parry": {
      foundry.utils.setProperty(document, "system.activation.type", "reactiondamage");
      effect.changes.push(
        {
          "key": "flags.midi-qol.DR.all",
          "mode": CONST.ACTIVE_EFFECT_MODES.ADD,
          "value": "1",
          "priority": "20",
        },
      );
      break;
    }
    // no default
  }
  // flags.dnd5e.initiativeAdv

  // set target
  switch (name) {
    case "Maneuvers: Trip Attack":
    case "Maneuvers: Maneuvering Attack":
    case "Maneuvers: Goading Attack":
    case "Maneuvers: Distracting Strike":
    case "Maneuvers: Menacing Attack":
    case "Maneuvers: Sweeping Attack":
    case "Maneuvers: Disarming Attack":
    case "Maneuvers: Pushing Attack":
    case "Maneuvers: Bait and Switch":
    case "Maneuvers: Commander’s Strike":
    case "Maneuvers: Commander's Strike": {
      foundry.utils.setProperty(document, "system.target.value", 1);
      foundry.utils.setProperty(document, "system.target.type", "creature");
      break;
    }
    // no default
  }

  // set regular damage
  switch (name) {
    case "Maneuvers: Parry":
    case "Maneuvers: Trip Attack":
    case "Maneuvers: Maneuvering Attack":
    case "Maneuvers: Goading Attack":
    case "Maneuvers: Distracting Strike":
    case "Maneuvers: Menacing Attack":
    case "Maneuvers: Sweeping Attack":
    case "Maneuvers: Disarming Attack":
    case "Maneuvers: Pushing Attack": {
      foundry.utils.setProperty(document, "system.damage.parts", [[diceString]]);
      break;
    }
    // no default
  }

  switch (name) {
    case "Maneuvers: Precision Attack": {
      foundry.utils.setProperty(document, "system.damage.parts", [[diceString, "midi-none"]]);
      break;
    }
    // no default
  }

  // saves
  switch (name) {
    case "Maneuvers: Trip Attack":
    case "Maneuvers: Disarming Attack":
    case "Maneuvers: Pushing Attack": {
      foundry.utils.setProperty(effect, "flags.midiProperties.fulldam", true);
      foundry.utils.setProperty(document, "system.damage.parts", [[diceString]]);
      foundry.utils.setProperty(document, "system.save", { ability: "str", dc: null, "scaling": ability });
      break;
    }
    case "Maneuvers: Menacing Attack":
    case "Maneuvers: Goading Attack": {
      foundry.utils.setProperty(effect, "flags.midiProperties.fulldam", true);
      foundry.utils.setProperty(document, "system.damage.parts", [[diceString]]);
      foundry.utils.setProperty(document, "system.save", { ability: "wis", dc: null, "scaling": ability });
      break;
    }
    // no default
  }

  return document;
}

