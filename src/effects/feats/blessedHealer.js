import { baseItemEffect } from "../effects.js";
import { DDBMacros } from "../../lib/_module.mjs";

export async function blessedHealerEffect(document) {
  let effect = baseItemEffect(document, document.name);
  await DDBMacros.setItemMacroFlag(document, "feat", "blessedHealer.js");

  effect.changes.push(
    DDBMacros.generateOnUseMacroChange({ macroPass: "postActiveEffects", macroType: "feat", macroName: "blessedHealer.js", document }),
  );
  DDBMacros.setMidiOnUseMacroFlag(document, "feat", "blessedHealer.js", ["postActiveEffects"]);

  document.effects.push(effect);
  return document;
}
