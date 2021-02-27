import utils from "../../utils.js";
import logger from "../../logger.js";

function buildBaseEffect(label) {
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
 *
 * @param {*} formula
 * @param {*} mode
 * @param {*} itemData
 * @param {*} label
 * @param {*} origin
 */

export function generateFixedACEffect(formula, label, alwaysActive=false, priority=30, mode=CONST.ACTIVE_EFFECT_MODES.OVERRIDE) {
  let effect = buildBaseEffect(label);

  effect.flags = {
    dae: { transfer: true, armorEffect: true },
    ddbimporter: { disabled: !alwaysActive, itemId: null, entityTypeId: null }
  };
  //effect.disabled = !alwaysActive;
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
 * @param {*} itemData
 * @param {*} origin
 * @param {*} armorData
 */
function generateArmorEffect(itemData, origin, armorData) {
  let label = `AC${itemData.data.armor.type === "shield" ? "+" : "="}${itemData.data.armor.value}`;
  if (itemData.data.armor?.type === "light") label += "+dex.mod";
  if (itemData.data.armor?.type === "medium") label += "+dex.mod|2";

  switch (armorData.type) {
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

function createArmorEffect(actor, itemData) {
  if (!itemData.effects && itemData.data.effects) itemData = itemData.data;
  if (!calculateArmor || itemData.type !== "equipment") return true;
  // armor created on actor, screae armor effect.
  const origin = `Actor.${actor.id}.OwnedItem.${itemData._id}`;
  // const origin = actor.items.get(itemData._id).uuid;
  itemData.effects = itemData.effects?.filter((efData) => !efData.flags.dae?.armorEffect) || [];
  switch (itemData.data.armor?.type) {
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

