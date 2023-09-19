import { baseSpellEffect } from "../specialSpells.js";
import { loadMacroFile, generateMacroChange, generateItemMacroFlag, setMidiOnUseMacroFlag } from "../macros.js";
import { effectModules } from "../effects.js";

export async function spikeGrowthEffect(document) {
  // we require active auras for this effect
  if (!effectModules().activeAurasInstalled) return document;

  const itemMacroText = await loadMacroFile("spell", "spikeGrowth.js");
  document = generateItemMacroFlag(document, itemMacroText);

  let effect = baseSpellEffect(document, document.name);
  effect.changes.push(
    {
      key: "system.attributes.movement.walk",
      value: "0.5",
      mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY,
      priority: 30,
    },
  );
  effect.changes.push(generateMacroChange(""));
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
  setProperty(effect, "duration.seconds", 600);
  setProperty(effect, "flags.dae.specialDuration", ["isMoved"]);
  setMidiOnUseMacroFlag(document, "spell", "spikeGrowth.js", ["preActiveEffects"]);

  document.effects.push(effect);
  return document;
}
