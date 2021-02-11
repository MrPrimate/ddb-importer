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


import { ABILITIES } from "../muncher/monster/abilities.js";
import { SKILLS } from "../muncher/monster/skills.js";


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
export function createArmorEffect(actor, itemData) {
  if (!itemData.effects && itemData.data.effects) itemData = itemData.data;
  if (!calculateArmor || itemData.type !== "equipment") return true;
  // armor created on actor, screae armor effect.
  const origin = `Actor.${actor.id}.OwnedItem.${itemData._id}`;
  // const origin = actor.items.get(itemData._id).uuid;
  itemData.effects = itemData.effects?.filter(efData => !efData.flags.dae?.armorEffect) || [];
  switch(itemData.data.armor?.type) {
    case "natural":
      setProperty(itemData, "flags.dae.alwaysActive", true);
      //@ts-ignore
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

export function generateArmorEffect(itemData, origin, armorData) {
  switch(armorData.type) {
    case "shield":
      //@ts-ignore
      let ae = armorEffectFromFormula(`${armorData.value}`, CONST.ACTIVE_EFFECT_MODES.ADD, itemData, origin);
      ae.changes.forEach(c => c.priority = 7)
      return ae;
    case "natural":
      //@ts-ignore
      return armorEffectFromFormula(`@abilities.dex.mod + ${armorData.value}`, CONST.ACTIVE_EFFECT_MODES.OVERRIDE, itemData, origin);
    case "light":
      //@ts-ignore
      return armorEffectFromFormula(`{@abilities.dex.mod, ${armorData.dex || 99}}kl + ${armorData.value}`, CONST.ACTIVE_EFFECT_MODES.OVERRIDE, itemData, origin);
    case "medium":
      //@ts-ignore
      return armorEffectFromFormula(`{@abilities.dex.mod,2}kl + ${armorData.value}`, CONST.ACTIVE_EFFECT_MODES.OVERRIDE, itemData, origin);
      case "heavy":
      //@ts-ignore
      return armorEffectFromFormula(`${armorData.value}`, CONST.ACTIVE_EFFECT_MODES.OVERRIDE, itemData, origin);
    default:
      return null;
      break;
  }
}

function armorEffectFromFormula(formula, mode, itemData, origin) {
  let label = `AC${itemData.data.armor.type === "shield" ? "+" : "="}${itemData.data.armor.value}`;
  if ("light" === itemData.data.armor?.type) label += "+dex.mod";
  if ("medium" === itemData.data.armor?.type) label += "+dex.mod|2";

    return {
      label,
    icon: itemData.img,
    changes: [
      {
        key: "data.attributes.ac.value",
        value: formula,
        mode,
        priority: 4
      },
    ],
    transfer: true,
    origin,
    flags: {dae: {transfer: true, armorEffect: true}}
  };
}
