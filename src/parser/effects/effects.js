import utils from "../../utils.js";
import logger from "../../logger.js";

/**
 * Add supported effects here to exclude them from calculations.
 * Currently only effects on equipment (i.e. items) are supported.
 */
export const EFFECT_EXCLUDED_MODIFIERS = [
  { modifiers: "item", type: "bonus", subType: "armor-class", key: "data.attributes.ac.value" },
  { modifiers: "item", type: "bonus", subType: "saving-throws", key: "data.bonuses.abilities.save" },
  { modifiers: "item", type: "bonus", subType: "ability-checks", key: "data.bonuses.abilities.check" },
  { modifiers: "item", type: "bonus", subType: "skill-checks", key: "data.bonuses.abilities.skill" },

  //
  // { modifiers: "item", type: "bonus", subType: "skill-checks", key: "data.bonuses.abilities.skill" },
  // data.bonuses.rwak.attack
  // data.bonuses.mwak.attack
  // data.bonuses.rwak.damage
  // data.bonuses.mwak.damage
  // data.bonuses.spell.attack
  // data.bonuses.spell.damage
  // data.bonuses.spell.dc
  // data.bonuses.heal.damage
  // data.skills.prc.passive
  // data.skills.per.value

  // data.traits.ci.value // condition immunity
  // data.traits.di.value // damage immunity
  // data.traits.dr.value // damage resistance
  // data.traits.dv.value // damage vulnerability

  // data.traits.languages.value // languages
  // data.attributes.hp.value // hp

  // data.abilities.con.value //

];

// I used DAE as a reference
// https://gitlab.com/tposney/dae/-/blob/master/src/module/dae.ts
/**
 *
 * Generate an effect given inputs for AC
 *
 * @param {*} formula
 * @param {*} mode
 * @param {*} itemData
 * @param {*} label
 * @param {*} origin
 */

function baseItemEffect(foundryItem, label, origin) {
  return {
    label: label,
    icon: foundryItem.img,
    changes: [],
    duration: {
      seconds: null,
      startTime: null,
      rounds: null,
      turns: null,
      startRound: null,
      startTurn: null,
    },
    // tint: "",
    transfer: true,
    disabled: false,
    origin: origin,
    flags: {
      dae: {
        transfer: true,
        stackable: false,
        // armorEffect: true
      },
      ddbimporter: {
        disabled: false
      }
    },
    //_id: `${randomID()}${randomID()}`,
  };
}

function generateAddBonusChange(bonus, priority, type) {
  return {
    key: EFFECT_EXCLUDED_MODIFIERS.find((mod) => mod.subType === type).key,
    value: bonus,
    mode: CONST.ACTIVE_EFFECT_MODES.ADD,
    priority: priority,
  };
}

function generateCustomBonusChange(bonus, priority, type) {
  return {
    key: EFFECT_EXCLUDED_MODIFIERS.find((mod) => mod.subType === type).key,
    value: `+${bonus}`,
    mode: 0,
    priority: priority,
  };
}


/**
 * Generates an AC bonus for an item
 */
function addACBonusEffect(ddbItem, foundryItem, type) {
  let changes = [];
  if (!ddbItem.definition?.grantedModifiers) return changes;
  const bonus = utils.filterModifiers(ddbItem.definition.grantedModifiers, "bonus", type).reduce((a, b) => a + b.value, 0);
  if (bonus !== 0) {
    logger.debug(`Generating ${type} bonus for ${foundryItem.name}`);
    changes.push(generateAddBonusChange(bonus, 18, type));
  }
  return changes;
}

/**
 * Generates a global Saving Throw bonus for an item
 */
function addCustomBonusEffect(ddbItem, foundryItem, type) {
  let changes = [];
  if (!ddbItem.definition?.grantedModifiers) return changes;
  const bonus = utils.filterModifiers(ddbItem.definition.grantedModifiers, "bonus", type).reduce((a, b) => a + b.value, 0);
  if (bonus !== 0) {
    logger.debug(`Generating ${type} bonus for ${foundryItem.name}`);
    changes.push(generateCustomBonusChange(bonus, 18, type));
  }
  return changes;
}

/**
 * Generate supported effects for items
 * @param {*} ddb
 * @param {*} character
 * @param {*} ddbItem
 * @param {*} foundryItem
 */
export function generateItemEffects(ddb, character, ddbItem, foundryItem) {
  console.warn(`Item: ${foundryItem.name}`, ddbItem);
  if (!ddbItem.definition?.grantedModifiers) return foundryItem;
  logger.debug(`Generating supported effects for ${foundryItem.name}`)

  // Update -actually might not need this, as it seems to add a value anyway to undefined
  // this item might not have been created yet - we will update these origins later in the character import
  // const origin = `ddb.${ddbItem.id}`;
  let effect = baseItemEffect(foundryItem, foundryItem.name, `OwnedItem.DDB${ddbItem.id}`);

  const acBonus = addACBonusEffect(ddbItem, foundryItem, "armor-class");
  const globalSaveBonus = addCustomBonusEffect(ddbItem, foundryItem, "saving-throws");
  const globalAbilityBonus = addCustomBonusEffect(ddbItem, foundryItem, "ability-checks");
  const globalSkillBonus = addCustomBonusEffect(ddbItem, foundryItem, "skill-checks");
  effect.changes = [...acBonus, ...globalSaveBonus, ...globalAbilityBonus, ...globalSkillBonus];

  // check attunement status etc

  if (!ddbItem.definition.canEquip && !ddbItem.definition.canAttune && !ddbItem.definition.isConsumable) {
    // if item just gives a thing and not potion/scroll
    effect.disabled = false;
    setProperty(effect, "flags.ddbimporter.disabled", false);
    setProperty(effect, "flags.dae.alwaysActive", true);
  } else if(
    (ddbItem.isAttuned && ddbItem.equipped) || // if it is attuned and equipped
    (ddbItem.isAttuned && !ddbItem.definition.canEquip) || // if it is attuned but can't equip
    (!ddbItem.definition.canAttune && ddbItem.equipped)) // can't attune but is equipped
  {
    setProperty(effect, "flags.ddbimporter.disabled", false);
    effect.disabled = false;
  } else {
    effect.disabled = true;
    setProperty(effect, "flags.ddbimporter.disabled", true);
  }

  setProperty(effect, "flags.ddbimporter.itemId", ddbItem.id);
  setProperty(effect, "flags.ddbimporter.itemEntityTypeId", ddbItem.entityTypeId);
  // set dae flag for active equipped
  if(ddbItem.definition.canEquip || ddbItem.definition.canAttune) {
    setProperty(effect, "flags.dae.activeEquipped", true);
  } else {
    setProperty(effect, "flags.dae.activeEquipped", false);
  }

  console.error(JSON.parse(JSON.stringify(effect)));
  console.warn(effect);

  if (effect.changes?.length > 0) {
    foundryItem.effects.push(effect);
  }

  console.warn(JSON.parse(JSON.stringify(foundryItem)));

  return foundryItem;
}

// TODO:
// * override ac
// * item effects
// * armour bases
// * natural armors
// * unarmoured effects, like monk
// * add durations for potions


// loop through generated effects and add equipped ones to character
// also need to update any effect images
