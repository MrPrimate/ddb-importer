import { baseSpellEffect } from "../specialSpells.js";
import DDBMacros from "../DDBMacros.js";

export async function enhanceAbilityEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.duration.rounds = 600;
  effect.duration.seconds = 3600;
  await DDBMacros.setItemMacroFlag(document, "spell", "enhanceAbility.js");
  effect.changes.push(DDBMacros.generateMacroChange({ macroType: "spell", macroName: "enhanceAbility.js" }));
  DDBMacros.setMidiOnUseMacroFlag(document, "spell", "enhanceAbility.js", ["postActiveEffects"]);
  document.effects.push(effect);

  return document;
}
