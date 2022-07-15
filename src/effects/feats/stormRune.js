import { baseFeatEffect } from "../specialFeats.js";

export function stormRuneEffect(document) {

  let baseEffect = baseFeatEffect(document, document.name);
  setProperty(document, "data.target.type", "self");
  setProperty(document, "data.range.units", "self");
  setProperty(document, "data.range.value", "");
  setProperty(document, "data.actionType", null);

  document.effects.push(baseEffect);

  let bonusEffect = baseFeatEffect(document, `${document.name} (Prophetic State)`);
  setProperty(bonusEffect, "duration.seconds", 60);
  setProperty(bonusEffect, "flags.core.statusId", "Prophetic State");

  // Missing effect for Prophetic State to enforce adv or disvantage

  document.effects.push(bonusEffect);


  return document;
}
