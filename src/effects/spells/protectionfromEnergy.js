import { baseSpellEffect } from "../specialSpells.js";
import DDBMacros from "../DDBMacros.js";

export async function protectionfromEnergyEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  await DDBMacros.setItemMacroFlag(document, "spell", "protectionfromEnergy.js");
  effect.changes.push(DDBMacros.generateMacroChange({ macroType: "spell", macroName: "protectionfromEnergy.js", priority: 0 }));
  document.effects.push(effect);

  return document;
}
