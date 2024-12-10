import { DDBMacros } from "../../lib/_module.mjs";
import { effectModules } from "../effects.js";

export async function contagionEffect(document) {
  if (effectModules().midiQolInstalled) {
    document.effects[0].flags.dae.macroRepeat = "endEveryTurn";
    await DDBMacros.setItemMacroFlag(document, "spell", "contagion.js");
    document.effects[0].changes.push(DDBMacros.generateMacroChange({ macroType: "spell", macroName: "contagion.js" }));
  }
  return document;
}
