import { forceItemEffect, addStatusEffectChange, baseFeatEffect } from "../effects";
import { DDBMacros } from "../../lib/_module";

function avalancheOfBonesEffect(document) {
  foundry.utils.setProperty(document, "system.duration", { value: null, units: "special" });
  foundry.utils.setProperty(document, "system.target", { value: 10, width: null, units: "ft", type: "creature" });
  foundry.utils.setProperty(document, "system.range", { value: null, long: null, units: "self" });

  const effect = baseFeatEffect(document, document.name);
  addStatusEffectChange({ effect, statusName: "Prone" });
  foundry.utils.setProperty(effect, "duration.value", 99);
  foundry.utils.setProperty(effect, "duration.units", "turns");
  effect.transfer = false;

  document.effects.push(effect);
  document = forceItemEffect(document);
  return document;
}

function fallingApartEffect(document) {
  const effect = baseFeatEffect(document, document.name);
  effect.system.changes.push(
    {
      "key": "flags.midi-qol.OverTime",
      "type": "override",
      "value": `turn=start, damageRoll=10, damageType=none, condition=@attributes.hp.value > 0 && @attributes.hp.value < @attributes.hp.max, label=${document.name}`,
      "priority": "20",
    },
  );
  effect.transfer = true;
  document.effects.push(effect);
  document = forceItemEffect(document);
  return document;
}

async function disassembleEffect(document) {
  const effect = baseFeatEffect(document, document.name);

  await DDBMacros.setItemMacroFlag(document, "monsterFeature", "disassemble.js");
  effect.system.changes.push(DDBMacros.generateMacroChange({ macroType: "monsterFeature", macroName: "disassemble.js", priority: 0 }));
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
