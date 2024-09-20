import DDBMacros from "../DDBMacros.js";
import { effectModules } from "../effects.js";

export async function wardingBondEffect(document) {
  if (effectModules().midiQolInstalled) {
    await DDBMacros.setItemMacroFlag(document, "spell", "wardingBond.js");
    document.effects[0].changes.push(DDBMacros.generateMacroChange({ macroType: "spell", macroName: "wardingBond.js" }));
  }

  return document;
}
