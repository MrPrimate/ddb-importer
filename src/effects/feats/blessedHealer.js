import { baseItemEffect } from "../effects.js";
import { loadMacroFile, generateItemMacroFlag, setMidiOnUseMacroFlag, generateOnUseMacroChange } from "../macros.js";

export async function blessedHealerEffect(document) {
  let effect = baseItemEffect(document, document.name);
  const itemMacroText = await loadMacroFile("feat", "blessedHealer.js");
  document = generateItemMacroFlag(document, itemMacroText);

  effect.changes.push(
    generateOnUseMacroChange({ macroPass: "postActiveEffects", macroType: "feat", macroName: "blessedHealer.js", document }),
  );
  setMidiOnUseMacroFlag(document, "feat", "blessedHealer.js", ["postActiveEffects"]);

  document.effects.push(effect);
  return document;
}
