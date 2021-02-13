import { ABILITIES } from "../../muncher/monster/abilities.js";
import { SKILLS } from "../../muncher/monster/skills.js";
import utils from "../../utils.js";
import logger from "../../logger.js";

/**
 *
 *
 */

function buildBaseEffect() {
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
    label: "",
    tint: "",
    disabled: false,
    selectedKey: [],
  };
  return effect;
}


function exampleEffectExtra(actor) {
  let effect = buildBaseEffect();
  ABILITIES.filter((ability) => actor.data.abilities[ability.value].proficient >= 1)
  .forEach((ability) => {
    const boost = {
      key: `data.abilities.${ability.value}.save`,
      mode: 2,
      value: characterProficiencyBonus,
      priority: 20,
    };
    effect.selectedKey.push(`data.abilities.${ability.value}.save`);
    effect.changes.push(boost);
  });
  SKILLS.filter((skill) => actor.data.skills[skill.name].prof >= 1)
    .forEach((skill) => {
      const boost = {
        key: `data.skills.${skill.name}.mod`,
        mode: 2,
        value: characterProficiencyBonus,
        priority: 20,
      };
      effect.selectedKey.push(`data.skills.${skill.name}.mod`);
      effect.changes.push(boost);
    });
  actor.effects = [effect];
}


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

function armorEffectFromFormula(formula, mode, itemData, label, origin) {
  return {
    label,
    icon: itemData.img,
    changes: [
      {
        key: "data.attributes.ac.value",
        value: formula,
        mode,
        priority: 6
      },
    ],
    duration: {
      seconds: null,
      startTime: null,
      rounds: null,
      turns: null,
      startRound: null,
      startTurn: null,
    },
    transfer: true,
    disabled: true,
    origin,
    flags: {dae: {transfer: true, armorEffect: true}}
  };
}

function generateACBonusEffect(itemData, origin, label, bonus) {
  let ae = armorEffectFromFormula(`${bonus}`, CONST.ACTIVE_EFFECT_MODES.ADD, itemData, label, origin);
  ae.changes.forEach(c => {
    c.priority = 11;
    //c.icon = "icons/svg/shield.svg";
  });
  return ae;
}

/**
 * Generate effect for Classic Armor
 * @param {*} itemData
 * @param {*} origin
 * @param {*} armorData
 */
function generateArmorEffect(itemData, origin, armorData) {
  let label = `AC${itemData.data.armor.type === "shield" ? "+" : "="}${itemData.data.armor.value}`;
  if ("light" === itemData.data.armor?.type) label += "+dex.mod";
  if ("medium" === itemData.data.armor?.type) label += "+dex.mod|2";

  switch(armorData.type) {
    case "shield":
      return generateACBonusEffect(itemData, origin, label, armorData.value);
    case "natural":
      return armorEffectFromFormula(`@abilities.dex.mod + ${armorData.value}`, CONST.ACTIVE_EFFECT_MODES.OVERRIDE, itemData, label, origin);
    case "light":
      return armorEffectFromFormula(`{@abilities.dex.mod, ${armorData.dex || 99}}kl + ${armorData.value}`, CONST.ACTIVE_EFFECT_MODES.OVERRIDE, itemData, label, origin);
    case "medium":
      return armorEffectFromFormula(`{@abilities.dex.mod,2}kl + ${armorData.value}`, CONST.ACTIVE_EFFECT_MODES.OVERRIDE, itemData, label, origin);
    case "heavy":
      return armorEffectFromFormula(`${armorData.value}`, CONST.ACTIVE_EFFECT_MODES.OVERRIDE, itemData, label, origin);
    default:
      return null;
      break;
  }
}

// this probably needs breaking out
// shit do these effects need to go in the item section?

function createArmorEffect(actor, itemData) {
  if (!itemData.effects && itemData.data.effects) itemData = itemData.data;
  if (!calculateArmor || itemData.type !== "equipment") return true;
  // armor created on actor, screae armor effect.
  const origin = `Actor.${actor.id}.OwnedItem.${itemData._id}`;
  // const origin = actor.items.get(itemData._id).uuid;
  itemData.effects = itemData.effects?.filter(efData => !efData.flags.dae?.armorEffect) || [];
  switch(itemData.data.armor?.type) {
    case "natural":
      setProperty(itemData, "flags.dae.alwaysActive", true);
      itemData.effects.push(generateArmorEffect(itemData, origin, itemData.data.armor));
      break;
    case "shield":
    case "light":
    case "medium":
    case "heavy":
      setProperty(itemData, "flags.dae.activeEquipped", true);
      itemData.effects.push(generateArmorEffect(itemData, origin, itemData.data.armor));
      break;
    default:
      break;
  }
  return true;
}

/**
 * Generates an AC bonus for an item
 */
export function addACBonusEffect(ddbItem, foundryItem) {
  console.warn(`Item: ${foundryItem.name}`, ddbItem);
  if (!ddbItem.definition?.grantedModifiers) return foundryItem;
  const acBonus = utils.filterModifiers(ddbItem.definition.grantedModifiers, "bonus", "armor-class").reduce((a, b) => a + b.value, 0);
  if (acBonus !== 0) {
    // this item might not have been created yet - we will update these origins later in the character import
    const origin = `ddb.${ddbItem.id}`;
    const label = `${foundryItem.name} AC Bonus`;
    let effect = generateACBonusEffect(foundryItem, origin, label, acBonus);

    if (!ddbItem.definition.canEquip && !ddbItem.definition.canAttune && !ddbItem.definition.isConsumable) {
      // if item just gives a thing and not potion/scroll
      effect.disabled = false;
      setProperty(effect, "flags.dae.alwaysActive", true);
    } else if(
      (ddbItem.isAttuned && ddbItem.equipped) || // if it is attuned and equipped
      (ddbItem.isAttuned && !ddbItem.definition.canEquip) || // if it is attuned but can't equip
      (!ddbItem.definition.canAttune && ddbItem.equipped)) // can't attune but is equipped
    {
      console.log("setting disabled to false")
      effect.disabled = false;
    }

    // set dae flag for active equipped
    if(ddbItem.definition.canEquip || ddbItem.definition.canAttune) {
      setProperty(effect, "flags.dae.activeEquipped", true);
    }


    foundryItem.effects.push(effect);
  }
  console.warn(foundryItem);
  return foundryItem;
}

/**
 *
 * @param {*} actor
 * @param {*} ddb
 * @param {*} ddbItem
 * @param {*} foundryItem
 */
function effectifyItem(actor, ddb, ddbItem, foundryItem) {
  const maxDexMedium = Math.max(...utils.filterBaseModifiers(ddb, "set", "ac-max-dex-armored-modifier").map((mod) => mod.value), 2);
  logger.debug("Max Dex Mod medium Armor", maxDexMedium);
  return foundryItem;
}


// TODO:
// * override ac
// * item effects
// * armour bases
// * natural armors
// * unarmoured effects, like monk


// loop through generated effects and add equipped ones to character
// also need to update any effect images
