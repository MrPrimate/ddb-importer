import { logger } from "../lib/_module.mjs";
import { DDBModifiers } from "../parser/lib/_module.mjs";
import { addAddBonusChanges } from "./effects.js";

// // ac -
// { type: "bonus", subType: "armor-class" },
// // e.g. robe of the archm
// { type: "set", subType: "unarmored-armor-class" },
// // bracers of defence
// { type: "bonus", subType: "unarmored-armor-class" },

function buildBaseACEffect(name) {
  let effect = {
    name,
    changes: [],
    duration: {
      seconds: null,
      startTime: null,
      rounds: null,
      turns: null,
      startRound: null,
      startTurn: null,
    },
    origin: null,
    tint: "",
    disabled: true,
    transfer: true,
    selectedKey: [],
    img: "icons/svg/shield.svg",
  };
  return effect;
}

// function maxACWrapper(formula) {
//   return `max(${formula}, @attributes.ac.armor + @attributes.ac.dex)`;
// }

/**
 *
 * Generate an effect given inputs for AC
 * This is a high priority set effect that will typically override all other AE.
 * @param {string} formula
 * @param {string} label
 * @param {boolean} alwaysActive
 * @param {number} priority
 * @param {number} mode
 * @returns {object} effect
 */
export function generateFixedACEffect(formula, label, alwaysActive = false, priority = 30, mode = CONST.ACTIVE_EFFECT_MODES.OVERRIDE) {
  let effect = buildBaseACEffect(label);

  effect.flags = {
    dae: { transfer: true, armorEffect: true },
    ddbimporter: { disabled: !alwaysActive, itemId: null, entityTypeId: null, characterEffect: true },
  };
  // effect.disabled = !alwaysActive;
  effect.disabled = false;
  effect.origin = "AC";

  const formulaChange = { key: "system.attributes.ac.formula", value: formula, mode, priority };
  const calcChange = { key: "system.attributes.ac.calc", value: "custom", mode, priority };
  effect.changes.push(calcChange, formulaChange);

  return effect;
}

function addACBonusEffect(modifiers, name, subType, restrictions = ["while wearing heavy armor", "while not wearing heavy armor", "", null]) {
  const bonusModifiers = DDBModifiers.filterModifiersOld(modifiers, "bonus", subType, restrictions);
  const changes = addAddBonusChanges(bonusModifiers, name, subType, "system.attributes.ac.bonus");
  if (changes.length > 0) logger.debug(`Generating ${subType} bonus for ${name}`);

  return changes;
}


export function generateBonusACEffect(modifiers, label, subType, restrictions = [], alwaysActive = true) {
  let effect = buildBaseACEffect(label);

  effect.flags = {
    dae: { transfer: true, armorEffect: true },
    ddbimporter: { disabled: !alwaysActive, itemId: null, entityTypeId: null, characterEffect: true },
  };
  // effect.disabled = !alwaysActive;
  effect.disabled = false;
  effect.origin = "AC";

  const changes = addACBonusEffect(modifiers, label, subType, restrictions);
  if (changes.length > 0) effect.changes = changes;

  return effect;
}
