import DDBMacros from "../DDBMacros.mjs";
import { effectModules } from "../effects.js";

export async function heroesFeastEffect(document) {
  if (effectModules().midiQolInstalled) {
    await DDBMacros.setItemMacroFlag(document, "spell", "heroesFeast.js");
    document.effects[0].changes.push(DDBMacros.generateMacroChange({ macroValues: "@damage", macroType: "spell", macroName: "heroesFeast.js", priority: 0 }));
  }

  return document;
}
