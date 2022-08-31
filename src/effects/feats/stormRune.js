import { baseFeatEffect } from "../specialFeats.js";

export function stormRuneEffect(document) {

  let baseEffect = baseFeatEffect(document, document.name);
  setProperty(document, "system.target.type", "self");
  setProperty(document, "system.range.units", "self");
  setProperty(document, "system.range.value", "");
  setProperty(document, "system.actionType", null);

  document.effects.push(baseEffect);

  let bonusEffect = baseFeatEffect(document, `${document.name} (Prophetic State)`);
  setProperty(bonusEffect, "duration.seconds", 60);
  setProperty(bonusEffect, "flags.core.statusId", "Prophetic State");

  // Missing effect for Prophetic State to enforce adv or disvantage

  document.effects.push(bonusEffect);


  return document;
}
