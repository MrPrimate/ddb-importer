import { baseFeatEffect } from "../specialFeats.js";
import { generateStatusEffectChange } from "../specialSpells.js";
import { loadMacroFile, generateMacroChange, generateItemMacroFlag } from "../macros.js";
import logger from "../../logger.js";

// eslint-disable-next-line complexity
export async function maneuversEffect(ddb, character, document) {
  const fighterClass = ddb.character.classes.find((klass) => klass.definition.name === "Fighter");
  if (!fighterClass) return document;
  const combatSuperiority = fighterClass.classFeatures.find((feat) => feat.definition.name === "Combat Superiority");
  if (!combatSuperiority) return document;
  const dieValue = combatSuperiority.levelScale.dice.diceValue;

  logger.debug(`Generating effect for ${document.name}`);

  const characterAbilities = character.flags.ddbimporter.dndbeyond.effectAbilities;
  const ability = characterAbilities.str?.value > characterAbilities.dex?.value ? "str" : "dex";

  const name = document.flags.ddbimporter.originalName || document.name;
  let effect = baseFeatEffect(document, document.name);
  setProperty(document, "data.range.units", "");
  setProperty(document, "data.range.value", null);
  setProperty(document, "data.target.type", "self");

  // special durations
  switch (name) {
    case "Maneuvers: Rally": {
      setProperty(effect, "duration.seconds", 86400);
      setProperty(effect, "flags.dae.specialDuration", ["longRest"]);
      break;
    }
    case "Maneuvers: Brace":
    case "Maneuvers: Riposte": {
      setProperty(effect, "flags.dae.specialDuration", ["1Attack:mwak"]);
      setProperty(effect, "duration.turns", 2);
      break;
    }
    case "Maneuvers: Lunging Attack":
    case "Maneuvers: Sweeping Attack": {
      setProperty(effect, "duration.turns", 1);
      setProperty(effect, "flags.dae.specialDuration", ["1Attack:mwak"]);
      break;
    }
    case "Maneuvers: Quick Toss": {
      setProperty(effect, "duration.turns", 1);
      setProperty(effect, "flags.dae.specialDuration", ["1Attack:rwak"]);
      break;
    }
    case "Maneuvers: Tactical Assessment": {
      setProperty(effect, "flags.dae.specialDuration", ["isSkill.inv", "isSkill.his", "isSkill.ins"]);
      break;
    }
    case "Maneuvers: Commanding Presence": {
      setProperty(effect, "flags.dae.specialDuration", ["isSkill.itm", "isSkill.per", "isSkill.prf"]);
      break;
    }
    case "Maneuvers: Ambush": {
      setProperty(effect, "duration.turns", 1);
      setProperty(effect, "flags.dae.specialDuration", ["isSkill.ste"]);
      break;
    }
    case "Maneuvers: Distracting Strike": {
      setProperty(effect, "flags.dae.specialDuration", ["isAttacked", "turnStartSource"]);
      break;
    }
    case "Maneuvers: Bait and Switch": {
      setProperty(effect, "flags.dae.specialDuration", ["turnStartSource"]);
      break;
    }
    case "Maneuvers: Feinting Attack": {
      setProperty(effect, "duration.turns", 1);
      setProperty(effect, "flags.dae.specialDuration", ["1Attack:mwak", "1Attack:rwak"]);
      break;
    }
    case "Maneuvers: Trip Attack": {
      setProperty(document, "data.duration.units", "inst");
      break;
    }
    case "Maneuvers: Menacing Attack":
    case "Maneuvers: Goading Attack": {
      setProperty(effect, "flags.dae.specialDuration", ["turnEndSource"]);
      break;
    }
    case "Maneuvers: Grappling Strike": {
      setProperty(effect, "duration.turns", 1);
      setProperty(effect, "flags.dae.specialDuration", ["isSkill.ath"]);
      break;
    }
    case "Maneuvers: Parry": {
      setProperty(document, "data.duration.units", "inst");
      setProperty(effect, "flags.dae.specialDuration", ["isDamaged"]);
      break;
    }
    // no default
  }

  const damageEffect = {
    "key": "data.bonuses.mwak.damage",
    "mode": CONST.ACTIVE_EFFECT_MODES.ADD,
    "value": `+ 1d${dieValue}`,
    "priority": "20"
  };
  // damage effect
  switch (name) {
    case "Maneuvers: Riposte":
    case "Maneuvers: Brace": {
      // manual reaction types
      setProperty(document, "data.activation.type", "reactionmanual");
      effect.changes.push(damageEffect);
      document.effects.push(effect);
      break;
    }
    case "Maneuvers: Quick Toss":
    case "Maneuvers: Lunging Attack":
    case "Maneuvers: Commander’s Strike":
    case "Maneuvers: Commander's Strike":
    case "Maneuvers: Feinting Attack": {
      effect.changes.push(damageEffect);
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
            "key": `data.skills.${skill}.value`,
            "mode": CONST.ACTIVE_EFFECT_MODES.ADD,
            "value": `+ 1d${dieValue}`,
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
            "key": `data.skills.${skill}.value`,
            "mode": CONST.ACTIVE_EFFECT_MODES.ADD,
            "value": `+ 1d${dieValue}`,
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
          "key": "data.skills.ste.value",
          "mode": CONST.ACTIVE_EFFECT_MODES.ADD,
          "value": `+ 1d${dieValue}`,
          "priority": "20"
        },
        {
          "key": "data.attributes.init.bonus",
          "mode": CONST.ACTIVE_EFFECT_MODES.ADD,
          "value": `+ 1d${dieValue}`,
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
          "key": "data.attributes.ac.bonus",
          "mode": CONST.ACTIVE_EFFECT_MODES.ADD,
          "value": `+ 1d${dieValue}`,
          "priority": "20"
        }
      );
      document.effects.push(effect);
      break;
    }
    case "Maneuvers: Grappling Strike": {
      effect.changes.push(
        {
          "key": "data.skills.ath.value",
          "mode": CONST.ACTIVE_EFFECT_MODES.ADD,
          "value": `+ 1d${dieValue}`,
          "priority": "20"
        },
      );
      document.effects.push(effect);
      break;
    }
    case "Maneuvers: Menacing Attack": {
      effect.changes.push(generateStatusEffectChange("Frightened"));
      break;
    }
    case "Maneuvers: Trip Attack": {
      effect.changes.push(generateStatusEffectChange("Prone"));
      break;
    }
    case "Maneuvers: Parry": {
      setProperty(document, "data.activation.type", "reactiondamage");
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
      const itemMacroText = await loadMacroFile("feat", "maneuversRally.js");
      document.flags["itemacro"] = generateItemMacroFlag(document, itemMacroText);
      effect.changes.push(generateMacroChange(`1d${dieValue} @abilities.cha.mod`, 20));
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
      setProperty(document, "data.target.value", 1);
      setProperty(document, "data.target.type", "creature");
      break;
    }
    // no default
  }

  // set regular damage
  switch (name) {
    case "Maneuvers: Precision Attack":
    case "Maneuvers: Parry":
    case "Maneuvers: Trip Attack":
    case "Maneuvers: Maneuvering Attack":
    case "Maneuvers: Goading Attack":
    case "Maneuvers: Distracting Strike":
    case "Maneuvers: Menacing Attack":
    case "Maneuvers: Sweeping Attack":
    case "Maneuvers: Disarming Attack":
    case "Maneuvers: Pushing Attack": {
      setProperty(document, "data.damage.parts", [[`1d${dieValue}`]]);
      break;
    }
    // no default
  }

  // saves
  switch (name) {
    case "Maneuvers: Trip Attack":
    case "Maneuvers: Disarming Attack":
    case "Maneuvers: Pushing Attack": {
      setProperty(effect, "flags.midiProperties.fulldam", true);
      setProperty(document, "data.damage.parts", [[`1d${dieValue}`]]);
      setProperty(document, "data.save", { ability: "str", dc: null, "scaling": ability });
      break;
    }
    case "Maneuvers: Menacing Attack":
    case "Maneuvers: Goading Attack": {
      setProperty(effect, "flags.midiProperties.fulldam", true);
      setProperty(document, "data.damage.parts", [[`1d${dieValue}`]]);
      setProperty(document, "data.save", { ability: "wis", dc: null, "scaling": ability });
      break;
    }
    // no default
  }

  return document;
}

