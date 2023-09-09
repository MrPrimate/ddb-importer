import { baseItemEffect } from "../effects.js";
import { loadMacroFile, generateItemMacroFlag } from "../macros.js";

export async function blessedHealerEffect(document) {
  let effect = baseItemEffect(document, document.name);
  const itemMacroText = await loadMacroFile("feat", "blessedHealer.js");
  document = generateItemMacroFlag(document, itemMacroText);

  effect.changes.push({
    key: "flags.midi-qol.onUseMacroName",
    value: "ItemMacro.Blessed Healer, postActiveEffects",
    mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
    priority: "20",
  });
  setProperty(document, "flags.midi-qol.onUseMacroName", "[postActiveEffects]ItemMacro");

  document.effects.push(effect);
  return document;
}
