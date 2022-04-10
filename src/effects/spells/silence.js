import { baseSpellEffect, spellEffectModules, generateStatusEffectChange } from "../specialSpells.js";
import { loadMacroFile, generateItemMacroFlag } from "../macros.js";

export async function silenceEffect(document) {

  if (!spellEffectModules().activeAurasInstalled) {
    return document;
  }

  // if we have active auras use a more advanced macro
  const itemMacroText = await loadMacroFile("generic", "activeAuraOnly.js");
  document.flags["itemacro"] = generateItemMacroFlag(document, itemMacroText);

  let effect = baseSpellEffect(document, document.name);
  effect.changes.push(generateStatusEffectChange("Deafened", 20, true));
  effect.changes.push(
    {
      key: "flags.midi-qol.fail.spell.vocal",
      mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
      value: "1",
      priority: "50",
    },
    {
      key: "data.traits.di.value",
      mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
      value: "thunder",
      priority: "50",
    }
  );
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
    save: "",
    savedc: null,
    displayTemp: true,
  };
  setProperty(effect, "duration.seconds", 600);
  setProperty(document, "flags.midi-qol.onUseMacroName", "[preActiveEffects]ItemMacro");

  document.effects.push(effect);

  return document;
}
