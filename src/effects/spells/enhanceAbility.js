import { baseSpellEffect } from "../specialSpells.js";
import DDBMacros from "../DDBMacros.js";

export async function enhanceAbilityEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  await DDBMacros.setItemMacroFlag(document, "spell", "enhanceAbility.js");
  effect.changes.push(DDBMacros.generateMacroChange({ macroType: "spell", macroName: "enhanceAbility.js" }));
  document.effects.push(effect);

  return document;
}
