import { baseItemEffect } from "../effects.js";


export function auraOfHateEffect(document) {

  let alliesEffect = baseItemEffect(document, `${document.name} (Self) - Constant`);
  alliesEffect.changes.push({
    "key": "system.bonuses.mwak.damage",
    "mode": CONST.ACTIVE_EFFECT_MODES.ADD,
    "value": "+@abilities.cha.mod",
    "priority": 20
  });
  alliesEffect.statuses.push(alliesEffect.name);
  foundry.utils.setProperty(alliesEffect, "flags.dae.stackable", "none");

  document.effects.push(alliesEffect);


  if (!game.modules.get("ActiveAuras")?.active) return document;

  let otherEffect = baseItemEffect(document, `${document.name} (Fiends & Undead) - Constant`);
  otherEffect.flags.ActiveAuras = {
    aura: "All",
    radius: "@scale.oathbreaker.aura-of-hate",
    isAura: true,
    ignoreSelf: true,
    inactive: false,
    hidden: false,
    displayTemp: true,
    type: "undead; fiend",
  };
  otherEffect.changes.push({
    "key": "system.bonuses.mwak.damage",
    "mode": CONST.ACTIVE_EFFECT_MODES.ADD,
    "value": "+@abilities.cha.mod",
    "priority": 20
  });
  otherEffect.statuses.push(otherEffect.name);

  foundry.utils.setProperty(otherEffect, "flags.dae.stackable", "none");

  document.effects.push(otherEffect);


  return document;
}
