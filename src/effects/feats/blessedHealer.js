import { baseItemEffect } from "../effects.js";
import { loadMacroFile, generateItemMacroFlag, setMidiOnUseMacroFlag } from "../macros.js";

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
  setMidiOnUseMacroFlag(document, "feat", "blessedHealer.js", ["postActiveEffects"]);

  document.effects.push(effect);
  return document;
}
