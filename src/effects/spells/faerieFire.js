import { baseSpellEffect, generateTokenMagicFXChange, spellEffectModules } from "../specialSpells.js";
import { loadMacroFile, generateMacroChange, generateItemMacroFlag } from "../macros.js";

export async function faerieFireEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push({
    key: "flags.midi-qol.grants.advantage.attack.all",
    mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
    value: "1",
    priority: "20",
  });

  if (game.modules.get("ATL")?.active) {
    const itemMacroText = await loadMacroFile("spell", "faerieFire.js");
    document.flags["itemacro"] = generateItemMacroFlag(document, itemMacroText);
    effect.changes.push(generateMacroChange("", 20));
  }

  if (spellEffectModules().tokenMagicInstalled) {
    effect.changes.push(generateTokenMagicFXChange("glow"));
  }

  document.effects.push(effect);

  return document;
}
