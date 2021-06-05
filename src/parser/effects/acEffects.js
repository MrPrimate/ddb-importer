import utils from "../../utils.js";
import logger from "../../logger.js";
import DICTIONARY from "../../dictionary.js";
import { baseItemEffect, generateUpgradeChange, generateOverrideChange, generateAddChange } from "./effects.js";

  // // ac -
  // { type: "bonus", subType: "armor-class" },
  // // e.g. robe of the archm
  // { type: "set", subType: "unarmored-armor-class" },
  // // bracers of defence
  // { type: "bonus", subType: "unarmored-armor-class" },

/**
 *
 * @param {*} label
 */
function buildBaseACEffect(label) {
  let effect = {
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
    label,
    tint: "",
    disabled: true,
    transfer: true,
    selectedKey: [],
    icon: "icons/svg/shield.svg",
  };
  return effect;
}

/**
 *
 * Generate an effect given inputs for AC
 * This is a high priority set effect that will typically override all other AE.
 * @param {*} formula
 * @param {*} label
 * @param {*} alwaysActive
 * @param {*} priority
 * @param {*} mode
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

  const change = {
    key: "data.attributes.ac.value",
    value: formula,
    mode,
    priority,
  };

  effect.changes.push(change);

  return effect;
}


/**
 * Generate effect for Classic Armor
 * @param {*} ddb
 * @param {*} foundryItem
 */
function generateArmorItemEffect(ddb, ddbItem, foundryItem) {
  const maxDexMedium = Math.max(
    ...utils.filterBaseModifiers(ddb, "set", "ac-max-dex-armored-modifier", ["", null], true).map((mod) => mod.value),
    2
  );

  let change;
  // const foundryACValue = foundryItem.data.armor.value;
  const baseACValue = ddbItem.definition.armorClass;

  switch (foundryItem.data.armor.type) {
    case "shield": {
      change = generateAddChange(baseACValue, 18, "data.attributes.ac.value");
      break;
    }
    case "natural": {
      const key = `@abilities.dex.mod + ${baseACValue}`;
      change = generateOverrideChange(key, 15, "data.attributes.ac.value");
      break;
    }
    case "light": {
      const dexCap = foundryItem.data.armor.dex || 99;
      const key = `@abilities.dex.mod > ${dexCap} ? ${dexCap + baseACValue} : @abilities.dex.mod + ${baseACValue}`;
      change = generateOverrideChange(key, 15, "data.attributes.ac.value");
      break;
    }
    case "medium": {
      const key = `@abilities.dex.mod > ${maxDexMedium} ? ${maxDexMedium + baseACValue} : @abilities.dex.mod + ${baseACValue}`;
      change = generateOverrideChange(key, 15, "data.attributes.ac.value");
      break;
    }
    case "heavy": {
      const key = `${baseACValue}`;
      change = generateOverrideChange(key, 15, "data.attributes.ac.value");
      break;
    }
    // no default
  }
  return change;
}

/**
 *
 * @param {*} ddb
 * @param {*} foundryItem
 */
function createBaseArmorItemEffect(ddb, ddbItem, foundryItem) {
  let changes = [];
  switch (foundryItem.data.armor?.type) {
    case "natural": {
      setProperty(foundryItem, "flags.dae.alwaysActive", true);
      const effect = generateArmorItemEffect(ddb, ddbItem, foundryItem);
      if (effect) changes.push(effect);
      break;
    }
    case "shield":
    case "light":
    case "medium":
    case "heavy": {
      setProperty(foundryItem, "flags.dae.activeEquipped", true);
      const effect = generateArmorItemEffect(ddb, ddbItem, foundryItem);
      if (effect) changes.push(effect);
      break;
    }
    // no default
  }
  return changes;
}

/**
 * Generate stat sets
 *
 * @param {*} modifiers
 * @param {*} name
 * @param {*} subType
 */
function addACSetEffect(modifiers, name, subType) {
  let bonuses;

  if (modifiers.some((mod) => mod.statId !== null && mod.type === "set" && mod.subType === subType)) {
    modifiers.filter((mod) => mod.statId !== null && mod.type === "set" && mod.subType === subType)
      .forEach((mod) => {
        const ability = DICTIONARY.character.abilities.find((ability) => ability.id === mod.statId);
        if (bonuses) {
          bonuses += " ";
        } else {
          bonuses = "";
        }
        bonuses += `@abilities.${ability.value}.mod`;
      });
  } else {
    // others are picked up here e.g. Draconic Resilience
    const fixedValues = modifiers.filter((mod) => mod.type === "set" && mod.subType === subType).map((mod) => mod.value);
    bonuses = Math.max(fixedValues);
  }

  let effects = [];
  const maxDexTypes = ["ac-max-dex-unarmored-modifier", "ac-max-dex-modifier"];

  if (bonuses && bonuses != 0) {
    let effectString = "";
    switch (subType) {
      case "unarmored-armor-class": {
        let maxDexMod = 99;
        const ignoreDexMod = modifiers.some((mod) => mod.type === "ignore" && mod.subType === "unarmored-dex-ac-bonus");
        const maxDexArray = modifiers
          .filter((mod) => mod.type === "set" && maxDexTypes.includes(mod.subType))
          .map((mod) => mod.value);
        if (maxDexArray.length > 0) maxDexMod = Math.min(maxDexArray);
        if (ignoreDexMod) {
          effectString = `10 + ${bonuses}`;
        } else {
          effectString = `@abilities.dex.mod > ${maxDexMod} ? 10 + ${bonuses} + ${maxDexMod} : 10 + ${bonuses} + @abilities.dex.mod`;
        }
        break;
      }
      default: {
        effectString = `10 + ${bonuses} + @abilities.dex.mod`;
      }
    }

    logger.debug(`Generating ${subType} AC set for ${name}: ${effectString}`);
    effects.push(
      generateUpgradeChange(
        effectString,
        15,
        "data.attributes.ac.value"
      )
    );
  }
  return effects;
}

/**
 *
 * @param {*} modifiers
 * @param {*} name
 */
function addACSets(modifiers, name) {
  let changes = [];
  const stats = ["unarmored-armor-class"];
  stats.forEach((set) => {
    const result = addACSetEffect(modifiers, name, set);
    changes = changes.concat(result);
  });

  return changes;
}

/**
 * Generates an AC bonus for an item
 *
 * @param {*} modifiers
 * @param {*} name
 * @param {*} type
 */
function addACBonusEffect(modifiers, name, type) {
  let changes = [];
  const restrictions = [
    "while wearing heavy armor",
    "",
    null,
  ];
  const bonus = utils.filterModifiers(modifiers, "bonus", type, restrictions).reduce((a, b) => a + b.value, 0);
  if (bonus !== 0) {
    logger.debug(`Generating ${type} bonus for ${name}`);
    changes.push(generateAddChange(bonus, 18, "data.attributes.ac.value"));
  }
  return changes;
}

/**
 *
 * @param {*} ddb
 * @param {*} character
 * @param {*} ddbItem
 * @param {*} foundryItem
 * @param {*} isCompendiumItem
 */
export function generateBaseACItemEffect(ddb, character, ddbItem, foundryItem, isCompendiumItem) {
  const noModifiers = !ddbItem.definition?.grantedModifiers || ddbItem.definition.grantedModifiers.length === 0;
  const noACValue = !foundryItem.data?.armor?.value;
  if (noModifiers && noACValue) return foundryItem;
  // console.error(`Item: ${foundryItem.name}`, ddbItem);
  logger.debug(`Generating supported AC effects for ${foundryItem.name}`);

  let effect = baseItemEffect(foundryItem, `AC: ${foundryItem.name}`);

  // base ac effect from item value
  const base = createBaseArmorItemEffect(ddb, ddbItem, foundryItem);
  // base ac from modifiers
  const acSets = addACSets(ddbItem.definition.grantedModifiers, foundryItem.name);

  // ac bonus effects
  const acBonus = addACBonusEffect(
    ddbItem.definition.grantedModifiers,
    foundryItem.name,
    "armor-class",
    "data.attributes.ac.value"
  );
  const unarmoredACBonus = addACBonusEffect(
    ddbItem.definition.grantedModifiers,
    foundryItem.name,
    "unarmored-armor-class",
    "data.attributes.ac.value"
  );
  const armoredACBonus = addACBonusEffect(
    ddbItem.definition.grantedModifiers,
    foundryItem.name,
    "armored-armor-class",
    "data.attributes.ac.value"
  );
  const dualWieldACBonus = addACBonusEffect(
    ddbItem.definition.grantedModifiers,
    foundryItem.name,
    "dual-wield-armor-class",
    "data.attributes.ac.value"
  );

  effect.changes = [
    ...base,
    ...acSets,
    ...acBonus,
    ...unarmoredACBonus,
    ...armoredACBonus,
    ...dualWieldACBonus,
  ];

  if (effect.changes.length === 0) return foundryItem;

  // check attunement status etc
  if (
    isCompendiumItem ||
    foundryItem.type === "feat" ||
    (ddbItem.isAttuned && ddbItem.equipped) || // if it is attuned and equipped
    (ddbItem.isAttuned && !ddbItem.definition.canEquip) || // if it is attuned but can't equip
    (!ddbItem.definition.canAttune && ddbItem.equipped) // can't attune but is equipped
  ) {
    setProperty(foundryItem, "flags.dae.alwaysActive", false);
    setProperty(effect, "flags.ddbimporter.disabled", false);
    effect.disabled = false;
  } else {
    effect.disabled = true;
    setProperty(effect, "flags.ddbimporter.disabled", true);
    setProperty(foundryItem, "flags.dae.alwaysActive", false);
  }

  setProperty(effect, "flags.ddbimporter.itemId", ddbItem.id);
  setProperty(effect, "flags.ddbimporter.itemEntityTypeId", ddbItem.entityTypeId);
  // set dae flag for active equipped
  if (ddbItem.definition?.canEquip || ddbItem.definition?.canAttune) {
    setProperty(foundryItem, "flags.dae.activeEquipped", true);
  } else {
    setProperty(foundryItem, "flags.dae.activeEquipped", false);
  }

  if (effect.changes?.length > 0) {
    if (!foundryItem.effects) foundryItem.effects = [];
    foundryItem.effects.push(effect);
  }

  // console.warn(JSON.parse(JSON.stringify(foundryItem)));

  return foundryItem;
}
