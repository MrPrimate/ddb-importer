import { baseSpellEffect } from "../specialSpells";
import { DDBMacros } from "../../lib/_module";
import { effectModules } from "../effects";

export async function spikeGrowthEffect(document) {
  // we require active auras for this effect
  if (!effectModules().activeAurasInstalled) return document;

  await DDBMacros.setItemMacroFlag(document, "spell", "spikeGrowth.js");

  const effect = baseSpellEffect(document, document.name);
  effect.system.changes.push(
    {
      key: "system.attributes.movement.walk",
      value: "0.5",
      type: "multiply",
      priority: 30,
    },
  );
  effect.system.changes.push(DDBMacros.generateMacroChange({ macroType: "spell", macroName: "spikeGrowth.js" }));
  effect.flags["ActiveAuras"] = {
    isAura: true,
    aura: "All",
    radius: 20,
    alignment: "",
    type: "",
    ignoreSelf: false,
    height: false,
    hidden: false,
    // hostile: true,
    onlyOnce: false,
    // save: "dex",
    savedc: null,
    displayTemp: true,
  };
  foundry.utils.setProperty(effect, "duration.value", 600);
  foundry.utils.setProperty(effect, "duration.units", "seconds");
  foundry.utils.setProperty(effect, "flags.dae.specialDuration", ["isMoved"]);
  DDBMacros.setMidiOnUseMacroFlag(document, "spell", "spikeGrowth.js", ["preActiveEffects"]);

  document.effects.push(effect);
  return document;
}
