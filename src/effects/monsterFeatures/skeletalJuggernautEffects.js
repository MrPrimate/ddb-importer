import { generateStatusEffectChange } from "../effects.js";
import { baseFeatEffect } from "../specialFeats.js";

export function avalancheOfBonesEffect(document) {
  setProperty(document, "system.duration", { value: null, units: "special" });
  setProperty(document, "system.target", { value: 10, width: null, units: "ft", type: "creature" });
  setProperty(document, "system.range", { value: null, long: null, units: "self" });

  let effect = baseFeatEffect(document, document.name);
  effect.changes.push(generateStatusEffectChange("Prone", 20, true));
  setProperty(effect, "duration.turns", 99);
  setProperty(effect, "duration.seconds", 9999);
  effect.transfer = false;

  document.effects.push(effect);
  return document;
}


export async function skeletalJuggernautEffects(npc) {
  for (let item of npc.items) {
    if (item.name.startsWith("Avalanche of Bones")) {
      item = avalancheOfBonesEffect(item);
    }

  }

  return npc;
}
