import { baseFeatEffect } from "../specialFeats.js";

export function stormRuneEffect(document) {

  let baseEffect = baseFeatEffect(document, document.name);
  foundry.utils.setProperty(baseEffect, "duration.seconds", 60);
  foundry.utils.setProperty(baseEffect, "flags.dae.stackable", "noneName");

  foundry.utils.setProperty(document, "system.target.type", "self");
  foundry.utils.setProperty(document, "system.range.units", "self");
  foundry.utils.setProperty(document, "system.range.value", "");
  foundry.utils.setProperty(document, "system.actionType", null);
  document.effects.push(baseEffect);

  let bonusEffect = baseFeatEffect(document, `${document.name} (Prophetic State)`);
  foundry.utils.setProperty(bonusEffect, "duration.seconds", 60);
  foundry.utils.setProperty(bonusEffect, "flags.dae.stackable", "noneName");
  bonusEffect.statuses.push("Prophetic State");

  // Missing effect for Prophetic State to enforce adv or disvantage

  document.effects.push(bonusEffect);


  return document;
}
