import DDBMacros from "../DDBMacros.mjs";
import { effectModules } from "../effects.js";

export async function darkvisionEffect(document) {

  if (!effectModules().atlInstalled && effectModules().midiQolInstalled) {
    await DDBMacros.setItemMacroFlag(document, "spell", "darkvision.js");
    document.effects[0].changes.push(DDBMacros.generateMacroChange({ macroType: "spell", macroName: "darkvision.js" }));
  }

  return document;
}
