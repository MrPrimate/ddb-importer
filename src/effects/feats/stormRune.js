import { baseFeatEffect } from "../specialFeats.js";

export async function stormRuneEffect(document) {

  let baseEffect = baseFeatEffect(document, document.name);
  setProperty(document, "data.target.type", "self");
  setProperty(document, "data.range.units", "");
  setProperty(document, "data.range.value", null);

  baseEffect.transfer = true;
  baseEffect.changes.push(
    {
      key: "flags.midi-qol.advantage.skill.arc",
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      value: "1",
      priority: "20",
    },
  );
  // Missing : can't be surprised

  document.effects.push(baseEffect);

  let bonusEffect = baseFeatEffect(document, `${document.name} (Prophetic State)`);
  setProperty(bonusEffect, "duration.seconds", 60);
  setProperty(bonusEffect, "flags.core.statusId", "Prophetic State");

  // Missing effect for Prophetic State to enforce adv or disvantage

  document.effects.push(bonusEffect);


  return document;
}
