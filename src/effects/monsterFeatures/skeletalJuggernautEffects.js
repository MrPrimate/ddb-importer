/* eslint-disable no-await-in-loop */
import { forceItemEffect, addStatusEffectChange } from "../effects.js";
import { baseFeatEffect } from "../specialFeats.js";
import DDBMacros from "../DDBMacros.js";

function avalancheOfBonesEffect(document) {
  foundry.utils.setProperty(document, "system.duration", { value: null, units: "special" });
  foundry.utils.setProperty(document, "system.target", { value: 10, width: null, units: "ft", type: "creature" });
  foundry.utils.setProperty(document, "system.range", { value: null, long: null, units: "self" });

  let effect = baseFeatEffect(document, document.name);
  addStatusEffectChange(effect, "Prone", 20, true);
  foundry.utils.setProperty(effect, "duration.turns", 99);
  foundry.utils.setProperty(effect, "duration.seconds", 9999);
  effect.transfer = false;

  document.effects.push(effect);
  document = forceItemEffect(document);
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
  document = forceItemEffect(document);
  return document;
}

async function disassembleEffect(document) {
  let effect = baseFeatEffect(document, document.name);

  await DDBMacros.setItemMacroFlag(document, "monsterFeature", "disassemble.js");
  effect.changes.push(DDBMacros.generateMacroChange({ macroType: "monsterFeature", macroName: "disassemble.js", priority: 0 }));
  effect.transfer = true;
  foundry.utils.setProperty(effect, "flags.dae.specialDuration", ["zeroHP"]);
  document.effects.push(effect);
  document = forceItemEffect(document);
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
