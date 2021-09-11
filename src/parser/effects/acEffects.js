import utils from "../../utils.js";
import logger from "../../logger.js";
import DICTIONARY from "../../dictionary.js";
import { baseItemEffect, generateUpgradeChange, generateAddChange } from "./effects.js";

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
    const AUTO_AC = utils.versionCompare(game.data.system.data.version, "1.4.0") >= 0;
    if (AUTO_AC) {
      const daeInstalled = utils.isModuleInstalledAndActive("dae");
      // using bonus here adds them to the bonus field, but then items that add a bonsu don't get applied
      // (e.g. bracers of defense) if wearing something like robi of archmage.
      // this is set to value, and show up as separate line in ac calculation.
      // we set this to bonus if dae is not installed as itherwise it is not applied.
      if (daeInstalled) {
        changes.push(generateAddChange(bonus, 18, "data.attributes.ac.value"));
      } else {
        changes.push(generateAddChange(bonus, 18, "data.attributes.ac.bonus"));
      }
    } else {
      changes.push(generateAddChange(bonus, 18, "data.attributes.ac.value"));
    }
  }
  return changes;
}


function addEffectFlags(foundryItem, effect, ddbItem, isCompendiumItem) {
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

  return [foundryItem, effect];
}

function generateBaseACEffectChanges(ddb, character, ddbItem, foundryItem, isCompendiumItem, effect) {
  const noModifiers = !ddbItem.definition?.grantedModifiers || ddbItem.definition.grantedModifiers.length === 0;
  const noACValue = !foundryItem.data?.armor?.value;
  const daeInstalled = utils.isModuleInstalledAndActive("dae");
  const daeBonusField = daeInstalled ? "data.attributes.ac.value" : "data.attributes.ac.bonus";

  if (noModifiers && noACValue) return [];
  // console.error(`Item: ${foundryItem.name}`, ddbItem);
  logger.debug(`Generating supported AC changes for ${foundryItem.name} for effect ${effect.label}`);

  // base ac from modifiers
  const acSets = daeInstalled ? addACSets(ddbItem.definition.grantedModifiers, foundryItem.name) : [];

  // ac bonus effects
  const acBonus = addACBonusEffect(
    ddbItem.definition.grantedModifiers,
    foundryItem.name,
    "armor-class",
    daeBonusField
  );
  const unarmoredACBonus = addACBonusEffect(
    ddbItem.definition.grantedModifiers,
    foundryItem.name,
    "unarmored-armor-class",
    daeBonusField
  );
  const armoredACBonus = addACBonusEffect(
    ddbItem.definition.grantedModifiers,
    foundryItem.name,
    "armored-armor-class",
    daeBonusField
  );
  const dualWieldACBonus = addACBonusEffect(
    ddbItem.definition.grantedModifiers,
    foundryItem.name,
    "dual-wield-armor-class",
    daeBonusField
  );

  const acChanges = [
    ...acSets,
    ...acBonus,
    ...unarmoredACBonus,
    ...armoredACBonus,
    ...dualWieldACBonus,
  ];

  return acChanges;

}

// generates changes and adds to effect for item
export function generateACEffectChangesForItem(ddb, character, ddbItem, foundryItem, isCompendiumItem, effect) {
  const noModifiers = !ddbItem.definition?.grantedModifiers || ddbItem.definition.grantedModifiers.length === 0;

  if (noModifiers) return [foundryItem, effect];

  const acChanges = generateBaseACEffectChanges(ddb, character, ddbItem, foundryItem, isCompendiumItem, effect);

  if (acChanges.length === 0) return [foundryItem, effect]; ;

  effect.changes = effect.changes.concat(acChanges);

  // generate flags for effect (e.g. checking attunement and equipped status)
  [foundryItem, effect] = addEffectFlags(foundryItem, effect, ddbItem, isCompendiumItem);

  return [foundryItem, effect];

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

  // generate flags for effect (e.g. checking attunement and equipped status)
  [foundryItem, effect] = generateACEffectChangesForItem(ddb, character, ddbItem, foundryItem, isCompendiumItem, effect);

  if (effect.changes?.length > 0) {
    if (!foundryItem.effects) foundryItem.effects = [];
    foundryItem.effects.push(effect);
  }
  return foundryItem;
}
