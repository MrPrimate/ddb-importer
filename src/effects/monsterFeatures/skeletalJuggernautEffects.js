/* eslint-disable no-await-in-loop */
import { generateStatusEffectChange } from "../effects.js";
import { baseFeatEffect } from "../specialFeats.js";
import { generateItemMacroFlag, generateMacroChange, loadMacroFile } from "../macros.js";

function avalancheOfBonesEffect(document) {
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

function fallingApartEffect(document) {
  let effect = baseFeatEffect(document, document.name);
  effect.changes.push(
    {
      "key": "flags.midi-qol.OverTime",
      "mode": CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
      "value": `turn=start, damageRoll=10, damageType=none, condition=@attributes.hp.value > 0 && @attributes.hp.value < @attributes.hp.max, label=${document.name}`,
      "priority": "20"
    },
  );
  effect.transfer = true;
  document.effects.push(effect);
  return document;
}

async function disassembleEffect(document) {
  let effect = baseFeatEffect(document, document.name);

  const itemMacroText = await loadMacroFile("monsterFeature", "disassemble.js");
  setProperty(document, "flags.itemacro", generateItemMacroFlag(document, itemMacroText));
  effect.changes.push(generateMacroChange("", 0));
  effect.transfer = true;
  setProperty(effect, "flags.dae.specialDuration", ["zeroHP"]);
  document.effects.push(effect);
  return document;
}

export async function skeletalJuggernautEffects(npc) {
  for (let item of npc.items) {
    if (item.name.startsWith("Avalanche of Bones")) {
      item = avalancheOfBonesEffect(item);
    } else if (item.name.startsWith("Falling Apart")) {
      item = fallingApartEffect(item);
    } else if (item.name.startsWith("Disassemble")) {
      item = await disassembleEffect(item);
    }
  }

  return npc;
}
