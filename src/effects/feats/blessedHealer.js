import { baseItemEffect } from "../effects.js";
import DDBMacros from "../macros.js";

export async function blessedHealerEffect(document) {
  let effect = baseItemEffect(document, document.name);
  const itemMacroText = await DDBMacros.loadMacroFile("feat", "blessedHealer.js");
  document = DDBMacros.generateItemMacroFlag(document, itemMacroText);

  effect.changes.push(
    DDBMacros.generateOnUseMacroChange({ macroPass: "postActiveEffects", macroType: "feat", macroName: "blessedHealer.js", document }),
  );
  DDBMacros.setMidiOnUseMacroFlag(document, "feat", "blessedHealer.js", ["postActiveEffects"]);

  document.effects.push(effect);
  return document;
}
