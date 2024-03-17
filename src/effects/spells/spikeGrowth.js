import { baseSpellEffect } from "../specialSpells.js";
import DDBMacros from "../DDBMacros.js";
import { effectModules } from "../effects.js";

export async function spikeGrowthEffect(document) {
  // we require active auras for this effect
  if (!effectModules().activeAurasInstalled) return document;

  await DDBMacros.setItemMacroFlag(document, "spell", "spikeGrowth.js");

  let effect = baseSpellEffect(document, document.name);
  effect.changes.push(
    {
      key: "system.attributes.movement.walk",
      value: "0.5",
      mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY,
      priority: 30,
    },
  );
  effect.changes.push(DDBMacros.generateMacroChange({ macroType: "spell", macroName: "spikeGrowth.js" }));
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
  foundry.utils.setProperty(effect, "duration.seconds", 600);
  foundry.utils.setProperty(effect, "flags.dae.specialDuration", ["isMoved"]);
  DDBMacros.setMidiOnUseMacroFlag(document, "spell", "spikeGrowth.js", ["preActiveEffects"]);

  document.effects.push(effect);
  return document;
}
