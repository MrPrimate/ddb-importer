import { baseFeatEffect } from "../specialFeats.js";
import { addStatusEffectChange, forceManualReaction } from "../effects.js";
import DDBMacros from "../DDBMacros.js";
import logger from "../../logger.js";

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
    case "Maneuvers: Rally": {
      foundry.utils.setProperty(effect, "duration.seconds", 86400);
      foundry.utils.setProperty(effect, "flags.dae.specialDuration", ["longRest"]);
      break;
    }
    case "Maneuvers: Brace":
    case "Maneuvers: Riposte": {
      foundry.utils.setProperty(effect, "flags.dae.specialDuration", ["1Attack:mwak"]);
      foundry.utils.setProperty(effect, "duration.turns", 2);
      break;
    }
    case "Maneuvers: Lunging Attack":
    case "Maneuvers: Sweeping Attack": {
      foundry.utils.setProperty(effect, "duration.turns", 1);
      foundry.utils.setProperty(effect, "flags.dae.specialDuration", ["1Attack:mwak"]);
      break;
    }
    case "Maneuvers: Quick Toss": {
      foundry.utils.setProperty(effect, "duration.turns", 1);
      foundry.utils.setProperty(effect, "flags.dae.specialDuration", ["1Attack:rwak"]);
      break;
    }
    case "Maneuvers: Tactical Assessment": {
      foundry.utils.setProperty(effect, "flags.dae.specialDuration", ["isSkill.inv", "isSkill.his", "isSkill.ins"]);
      break;
    }
    case "Maneuvers: Commanding Presence": {
      foundry.utils.setProperty(effect, "flags.dae.specialDuration", ["isSkill.itm", "isSkill.per", "isSkill.prf"]);
      break;
    }
    case "Maneuvers: Ambush": {
      foundry.utils.setProperty(effect, "duration.turns", 1);
      foundry.utils.setProperty(effect, "flags.dae.specialDuration", ["isSkill.ste"]);
      break;
    }
    case "Maneuvers: Distracting Strike": {
      foundry.utils.setProperty(effect, "flags.dae.specialDuration", ["isAttacked", "turnStartSource"]);
      break;
    }
    case "Maneuvers: Bait and Switch": {
      foundry.utils.setProperty(effect, "flags.dae.specialDuration", ["turnStartSource"]);
      break;
    }
    case "Maneuvers: Feinting Attack": {
      foundry.utils.setProperty(effect, "duration.turns", 1);
      foundry.utils.setProperty(effect, "flags.dae.specialDuration", ["1Attack"]);
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

  const damageEffect = {
    "key": "system.bonuses.mwak.damage",
    "mode": CONST.ACTIVE_EFFECT_MODES.ADD,
    "value": `+ ${diceString}`,
    "priority": "20"
  };
  // damage effect
  switch (name) {
    case "Maneuvers: Riposte":
    case "Maneuvers: Brace": {
      // manual reaction types
      document = forceManualReaction(document);
      effect.changes.push(damageEffect);
      document.effects.push(effect);
      break;
    }
    case "Maneuvers: Quick Toss":
    case "Maneuvers: Lunging Attack":
    case "Maneuvers: Feinting Attack": {
      effect.changes.push(damageEffect);
      document.effects.push(effect);
      break;
    }
    // no default
  }

  const rangedDamageEffect = {
    "key": "system.bonuses.rwak.damage",
    "mode": CONST.ACTIVE_EFFECT_MODES.ADD,
    "value": `+ ${diceString}`,
    "priority": "20"
  };
  // damage effect
  switch (name) {
    case "Maneuvers: Commander’s Strike":
    case "Maneuvers: Commander's Strike": {
      effect.changes.push(damageEffect);
      effect.changes.push(rangedDamageEffect);
      document.effects.push(effect);
      break;
    }
    // no default
  }

  // other effects
  switch (name) {
    // advantage effect
    case "Maneuvers: Distracting Strike":
    case "Maneuvers: Feinting Attack": {
      effect.changes.push(
        {
          "key": "flags.midi-qol.advantage.attack.all",
          "mode": CONST.ACTIVE_EFFECT_MODES.ADD,
          "value": "1",
          "priority": "20"
        }
      );
      document.effects.push(effect);
      break;
    }
    // skill bonus
    case "Maneuvers: Commanding Presence": {
      ["per", "itm", "prf"].forEach((skill) => {
        effect.changes.push(
          {
            "key": `system.skills.${skill}.bonuses.check`,
            "mode": CONST.ACTIVE_EFFECT_MODES.ADD,
            "value": `+ ${diceString}`,
            "priority": "20"
          }
        );
      });
      document.effects.push(effect);
      break;
    }
    case "Maneuvers: Tactical Assessment": {
      ["inv", "his", "ins"].forEach((skill) => {
        effect.changes.push(
          {
            "key": `system.skills.${skill}.bonuses.check`,
            "mode": CONST.ACTIVE_EFFECT_MODES.ADD,
            "value": `+ ${diceString}`,
            "priority": "20"
          }
        );
      });
      document.effects.push(effect);
      break;
    }
    case "Maneuvers: Ambush": {
      effect.changes.push(
        {
          "key": "system.skills.ste.bonuses.check",
          "mode": CONST.ACTIVE_EFFECT_MODES.ADD,
          "value": `+ ${diceString}`,
          "priority": "20"
        },
        {
          "key": "system.attributes.init.bonus",
          "mode": CONST.ACTIVE_EFFECT_MODES.ADD,
          "value": `+ ${diceString}`,
          "priority": "20"
        }
      );
      document.effects.push(effect);
      break;
    }
    case "Maneuvers: Evasive Footwork":
    case "Maneuvers: Bait and Switch": {
      effect.changes.push(
        {
          "key": "system.attributes.ac.bonus",
          "mode": CONST.ACTIVE_EFFECT_MODES.ADD,
          "value": `+ ${diceString}`,
          "priority": "20"
        }
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
          "priority": "20"
        },
      );
      document.effects.push(effect);
      break;
    }
    case "Maneuvers: Menacing Attack": {
      addStatusEffectChange(effect, "Frightened", 20, true);
      break;
    }
    case "Maneuvers: Trip Attack": {
      addStatusEffectChange(effect, "Prone", 20, true);
      break;
    }
    case "Maneuvers: Parry": {
      foundry.utils.setProperty(document, "system.activation.type", "reactiondamage");
      effect.changes.push(
        {
          "key": "flags.midi-qol.DR.all",
          "mode": CONST.ACTIVE_EFFECT_MODES.ADD,
          "value": "1",
          "priority": "20"
        }
      );
      break;
    }
    case "Maneuvers: Rally": {
      await DDBMacros.setItemMacroFlag(document, "feat", "maneuversRally.js");
      effect.changes.push(DDBMacros.generateMacroChange({ macroValues: `${diceString} @abilities.cha.mod`, macroType: "feat", macroName: "maneuversRally.js" }));
      document.effects.push(effect);
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
    case "Maneuvers: Rally":
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

