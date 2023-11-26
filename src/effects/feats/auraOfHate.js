import { baseItemEffect } from "../effects.js";


export function auraOfHateEffect(document) {

  let alliesEffect = baseItemEffect(document, `${document.name} (Self) - Constant`);
  alliesEffect.changes.push({
    "key": "system.bonuses.mwak.damage",
    "mode": CONST.ACTIVE_EFFECT_MODES.ADD,
    "value": "+@abilities.cha.mod",
    "priority": 20
  });
  if (isNewerVersion(11, game.version)) {
    setProperty(alliesEffect, "flags.core.statusId", "1");
  } else {
    alliesEffect.statuses.push(alliesEffect.name);
  }
  setProperty(alliesEffect, "flags.dae.stackable", "none");

  document.effects.push(alliesEffect);


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
  if (isNewerVersion(11, game.version)) {
    setProperty(otherEffect, "flags.core.statusId", "1");
  } else {
    otherEffect.statuses.push(otherEffect.name);
  }
  setProperty(otherEffect, "flags.dae.stackable", "none");

  document.effects.push(otherEffect);


  return document;
}
